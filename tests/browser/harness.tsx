/** Browser-only rendering harness. Android platform services are tested separately. */
import React, { useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FinanceApp } from '../../src/ui/FinanceApp';
import { FinanceEngine } from '../../src/app/engine';
import type { AppController } from '../../src/app/contracts';
import type { FinanceState } from '../../src/domain';
import { generateWorkbook } from '../../src/export';

let stored: FinanceState | null = null;
let exportedBytes = 0;
const engine = new FinanceEngine({
  load: async () => stored,
  save: async value => { stored = structuredClone(value); },
  close: async () => undefined,
}, 'browser-ui-test');

declare global {
  interface Window {
    pablooooTest: { state(): FinanceState; exportedBytes(): number };
  }
}
window.pablooooTest = { state: () => engine.getSnapshot().state, exportedBytes: () => exportedBytes };

function Harness() {
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const controller: AppController = {
    ...snapshot, dispatch: engine.dispatch, dismissError: engine.dismissError,
    setReminders: enabled => engine.dispatch({ type: 'settings.update', value: { remindersEnabled: enabled } }),
    exportSpreadsheet: async range => { exportedBytes = (await generateWorkbook(engine.getSnapshot().state, range)).length; },
    exportBackup: async () => undefined,
    importBackup: async () => undefined,
    createShortcut: async () => undefined,
  };
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><FinanceApp controller={controller} /></SafeAreaProvider>;
}
await engine.initialize();
createRoot(document.getElementById('root')!).render(<Harness />);
