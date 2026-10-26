import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Alert, AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { AppAction } from '../domain/types';
import { initialState } from '../domain';
import { generateWorkbook } from '../export';
import {
  configureReminders,
  createPngShortcut,
  createRepository,
  exportBackup,
  pickBackup,
  shareSpreadsheet,
} from '../platform';
import type { AppController } from './contracts';
import { FinanceEngine } from './engine';
import { confirmRestore } from './confirm';
import { errorMessage } from './errors';
import { createActionService } from './actions';
import { createSessionManager } from './session';

const seed = initialState('loading');
const bootSnapshot = { state: seed, ready: false, busy: true, error: null };
const noopSubscribe = () => () => undefined;
const getBootSnapshot = () => bootSnapshot;
const sessions = createSessionManager();

export function useFinanceController(): {
  controller: AppController;
  retry(): void;
  fatal: string | null;
} {
  const [engine, setEngine] = useState<FinanceEngine | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const snapshot = useSyncExternalStore(
    engine?.subscribe ?? noopSubscribe,
    engine?.getSnapshot ?? getBootSnapshot,
  );
  const actions = useMemo(
    () => (engine ? createActionService(engine, configureReminders) : null),
    [engine],
  );

  useEffect(() => {
    let cancelled = false;
    const session = sessions.open(
      async () => new FinanceEngine(await createRepository(), Crypto.randomUUID()),
    );
    void session.ready
      .then((next) => {
        if (!cancelled && next) {
          setEngine(next);
          setFatal(null);
        }
      })
      .catch((error) => {
        if (!cancelled) setFatal(errorMessage(error));
      });
    return () => {
      cancelled = true;
      session.cancel();
    };
  }, [attempt]);

  // Refresh schedules after a timezone change while the app was in the background.
  useEffect(() => {
    if (!engine || !actions) return;
    const reconcile = async () => {
      try {
        await actions.reconcileReminders();
      } catch (error) {
        engine.reportError(error);
      }
    };
    void reconcile();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void reconcile();
    });
    return () => subscription.remove();
  }, [engine, actions]);

  const requireEngine = (): FinanceEngine => {
    if (!engine) throw new Error('Wait until your records finish loading.');
    return engine;
  };
  const run = async (task: () => Promise<void>): Promise<void> => {
    try {
      await task();
    } catch (error) {
      engine?.reportError(error);
      throw error;
    }
  };
  const dispatch = (action: AppAction): Promise<void> =>
    run(async () => {
      requireEngine();
      if (!actions) throw new Error('Wait until your records finish loading.');
      await actions.dispatch(action);
    });

  const controller: AppController = {
    ...snapshot,
    dismissError: () => engine?.dismissError(),
    dispatch,
    setReminders: (enabled) =>
      dispatch({ type: 'settings.update', value: { remindersEnabled: enabled } }),
    exportSpreadsheet: (range) =>
      run(async () => {
        requireEngine();
        if (!actions) throw new Error('Wait until your records finish loading.');
        const state = await actions.readState();
        const bytes = await generateWorkbook(state, range);
        await shareSpreadsheet(
          bytes,
          `Pabloooo-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
        );
      }),
    exportBackup: () =>
      run(async () => {
        requireEngine();
        if (!actions) throw new Error('Wait until your records finish loading.');
        await exportBackup(await actions.readState());
      }),
    importBackup: () =>
      run(async () => {
        requireEngine();
        const imported = await pickBackup();
        if (!imported || !(await confirmRestore())) return;
        if (!actions) throw new Error('Wait until your records finish loading.');
        await actions.restore(imported);
      }),
    createShortcut: () =>
      run(async () => {
        const result = await createPngShortcut();
        if (result.status !== 'cancelled') Alert.alert('Home-screen shortcut', result.message);
      }),
  };
  return {
    controller,
    fatal,
    retry: () => {
      setFatal(null);
      setEngine(null);
      setAttempt((value) => value + 1);
    },
  };
}
