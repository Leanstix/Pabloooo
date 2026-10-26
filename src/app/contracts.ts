import type { AppAction, DateRange, FinanceState } from '../domain/types';

export interface AppController {
  state: FinanceState;
  ready: boolean;
  busy: boolean;
  error: string | null;
  dismissError(): void;
  dispatch(action: AppAction): Promise<void>;
  exportSpreadsheet(range?: DateRange): Promise<void>;
  exportBackup(): Promise<void>;
  importBackup(): Promise<void>;
  createShortcut(): Promise<void>;
  setReminders(enabled: boolean): Promise<void>;
}
