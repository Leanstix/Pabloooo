import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { AppAction } from '../domain/types';
import { initialState } from '../domain';
import { generateWorkbook } from '../export';
import { configureReminders, createPngShortcut, createRepository, exportBackup, pickBackup, shareSpreadsheet } from '../platform';
import type { AppController } from './contracts';
import { FinanceEngine } from './engine';
import { confirmRestore } from './confirm';
import { errorMessage } from './errors';

const seed = initialState('loading');
const bootSnapshot = { state: seed, ready: false, busy: true, error: null };
const noopSubscribe = () => () => undefined;
const getBootSnapshot = () => bootSnapshot;

export function useFinanceController(): { controller: AppController; retry(): void; fatal: string | null } {
  const [engine, setEngine] = useState<FinanceEngine | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const alive = useRef(true);
  const initializationAttempt = useRef(0);
  const snapshot = useSyncExternalStore(engine?.subscribe ?? noopSubscribe, engine?.getSnapshot ?? getBootSnapshot);

  useEffect(() => {
    alive.current = true;
    const token = ++initializationAttempt.current;
    let close: (() => Promise<void>) | undefined;
    void (async () => {
      try {
        const repository = await createRepository();
        close = () => repository.close();
        const next = new FinanceEngine(repository, Crypto.randomUUID());
        await next.initialize();
        if (!alive.current || token !== initializationAttempt.current) {
          await repository.close();
          return;
        }
        setEngine(next);
        setFatal(null);
      } catch (error) {
        if (alive.current && token === initializationAttempt.current) setFatal(errorMessage(error));
        await close?.().catch(() => undefined);
      }
    })();
    return () => { alive.current = false; void close?.().catch(() => undefined); };
  }, [attempt]);

  // Refresh schedules after a timezone change while the app was in the background.
  useEffect(() => {
    if (!engine) return;
    const reconcile = async () => {
      const settings = engine.getSnapshot().state.settings;
      try { await configureReminders(settings.remindersEnabled, settings); }
      catch (error) { engine.reportError(error); }
    };
    void reconcile();
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') void reconcile(); });
    return () => subscription.remove();
  }, [engine]);

  const requireEngine = (): FinanceEngine => {
    if (!engine) throw new Error('Wait until your records finish loading.');
    return engine;
  };
  const run = async (task: () => Promise<void>): Promise<void> => {
    try { await task(); }
    catch (error) { engine?.reportError(error); throw error; }
  };
  const dispatch = (action: AppAction): Promise<void> => run(async () => {
    const current = requireEngine();
    const previous = current.getSnapshot().state.settings;
    if (action.type === 'settings.update' && ('morningTime' in action.value || 'eveningTime' in action.value || 'remindersEnabled' in action.value)) {
      const next = { ...previous, ...action.value };
      await configureReminders(next.remindersEnabled, next);
      try { await current.dispatch(action); }
      catch (error) {
        try { await configureReminders(previous.remindersEnabled, previous); }
        catch { current.reportError(new Error('Your settings could not be saved and Android could not restore the previous reminders. Configure reminders again.')); }
        throw error;
      }
    } else await current.dispatch(action);
  });

  const controller: AppController = {
    ...snapshot,
    dismissError: () => engine?.dismissError(),
    dispatch,
    setReminders: enabled => dispatch({ type: 'settings.update', value: { remindersEnabled: enabled } }),
    exportSpreadsheet: range => run(async () => {
      const state = requireEngine().getSnapshot().state;
      const bytes = await generateWorkbook(state, range);
      await shareSpreadsheet(bytes, `Pabloooo-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    }),
    exportBackup: () => run(async () => exportBackup(requireEngine().getSnapshot().state)),
    importBackup: () => run(async () => {
      const current = requireEngine();
      const imported = await pickBackup();
      if (!imported || !(await confirmRestore())) return;
      const previous = current.getSnapshot().state.settings;
      await configureReminders(false, previous);
      try { await current.restore(imported); }
      catch (error) {
        await configureReminders(previous.remindersEnabled, previous).catch(() => undefined);
        throw error;
      }
    }),
    createShortcut: () => run(async () => {
      const result = await createPngShortcut();
      if (result.status !== 'cancelled') Alert.alert('Home-screen shortcut', result.message);
    }),
  };
  return { controller, fatal, retry: () => { setFatal(null); setEngine(null); setAttempt(value => value + 1); } };
}
