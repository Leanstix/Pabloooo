import { vi } from 'vitest';
import { initialState } from '../../src/domain';
import type { FinanceState, TransactionInput } from '../../src/domain/types';
import type { FinanceRepository } from '../../src/app/repository';

export const entry = (id: string, amountKobo = 120000): TransactionInput => ({
  id,
  kind: 'expense',
  amountKobo,
  categoryId: 'category-feeding',
  note: 'Lunch',
  merchant: 'Canteen',
  occurredAt: '2026-10-26T12:00:00.000Z',
  recurringId: null,
});
export function memoryRepository(stored: FinanceState | null = null) {
  let value = stored;
  const repository: FinanceRepository = {
    load: vi.fn(async () => (value === null ? null : structuredClone(value))),
    save: vi.fn(async (state) => {
      value = structuredClone(state);
    }),
    close: vi.fn(async () => undefined),
  };
  return { repository, read: () => value };
}
export const fresh = () => initialState('test-phone', '2026-10-26T00:00:00.000Z');
