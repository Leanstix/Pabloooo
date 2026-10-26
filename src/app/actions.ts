import { reduceFinance } from '../domain';
import type { AppAction, Settings } from '../domain/types';
import type { FinanceEngine } from './engine';
import { errorMessage } from './errors';

export type ReminderConfigurator = (enabled: boolean, settings: Settings) => Promise<void>;

/** Keep Android side effects and database mutations in the same ordered operation. */
export function createActionService(engine: FinanceEngine, reminders: ReminderConfigurator) {
  let queue: Promise<void> = Promise.resolve();
  function serial(task: () => Promise<void>): Promise<void> {
    const result = queue.then(task);
    queue = result.catch(() => undefined);
    return result;
  }
  async function rollback(previous: Settings, original: unknown): Promise<never> {
    try { await reminders(previous.remindersEnabled, previous); }
    catch {
      throw new Error(`${errorMessage(original)} Android could not restore the previous reminder schedule. Configure reminders again.`);
    }
    throw original;
  }
  return {
    dispatch: (action: AppAction): Promise<void> => serial(async () => {
      const previous = engine.getSnapshot().state;
      // Validate before asking Android for permission or changing scheduled reminders.
      const next = reduceFinance(previous, action);
      const affectsReminders = action.type === 'settings.update' &&
        ['morningTime', 'eveningTime', 'remindersEnabled'].some(key => key in action.value);
      if (affectsReminders) {
        await reminders(next.settings.remindersEnabled, next.settings);
        try { await engine.dispatch(action); }
        catch (error) { await rollback(previous.settings, error); }
      } else await engine.dispatch(action);
    }),
    restore: (input: unknown): Promise<void> => serial(async () => {
      const previous = engine.getSnapshot().state.settings;
      await reminders(false, previous);
      try { await engine.restore(input); }
      catch (error) { await rollback(previous, error); }
    }),
  };
}
