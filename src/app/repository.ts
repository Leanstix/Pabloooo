import type { FinanceState } from '../domain/types';

export interface FinanceRepository {
  load(): Promise<FinanceState | null>;
  save(state: FinanceState): Promise<void>;
  close(): Promise<void>;
}
