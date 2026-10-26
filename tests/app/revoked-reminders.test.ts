import { expect, it, vi } from 'vitest';
import { createActionService, type ReminderConfigurator } from '../../src/app/actions';
import { FinanceEngine } from '../../src/app/engine';
import { fresh, memoryRepository } from './fixtures';

it('turns off saved reminder intent when Android permission has been revoked', async () => {
  const state = fresh();
  state.settings.remindersEnabled = true;
  const memory = memoryRepository(state);
  const engine = new FinanceEngine(memory.repository, 'phone');
  await engine.initialize();
  const denied = Object.assign(new Error('Allow notifications in Android settings'), {
    code: 'notification-permission',
  });
  const reminders = vi
    .fn<ReminderConfigurator>()
    .mockRejectedValueOnce(denied)
    .mockResolvedValueOnce(undefined);
  const actions = createActionService(engine, reminders);
  await expect(actions.reconcileReminders()).rejects.toThrow('Allow notifications');
  expect(memory.read()?.settings.remindersEnabled).toBe(false);
  expect(reminders.mock.calls.map((call) => call[0])).toEqual([true, false]);
});
