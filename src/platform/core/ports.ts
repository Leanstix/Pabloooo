import type { FinanceState } from '../../domain/types';
export type StateValidator = (value: unknown) => FinanceState;
export type SqlValue = string | number | null;
export interface SqlTransaction {
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<{ changes: number }>;
  execAsync(sql: string): Promise<void>;
}
export interface SqlDatabase extends SqlTransaction {
  withExclusiveTransactionAsync(task: (transaction: SqlTransaction) => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}
export interface StateRepository {
  load(): Promise<FinanceState | null>;
  save(state: FinanceState): Promise<void>;
  close(): Promise<void>;
}
