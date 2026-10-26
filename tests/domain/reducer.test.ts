import { describe, expect, it } from 'vitest';
import { initialState } from '../../src/domain/initial';
import { reduceFinance } from '../../src/domain/reducer';
import type { AppAction, FinanceState, TransactionInput } from '../../src/domain/types';

const now = '2026-10-26T12:00:00Z';
const seed = () => initialState('reducer-test', now);
const entry = (overrides: Partial<TransactionInput> = {}): TransactionInput => ({ id: 't1', kind: 'expense', amountKobo: 50000, categoryId: 'category-feeding', occurredAt: now, note: 'Lunch', merchant: 'Mama Put', recurringId: null, ...overrides });
const apply = (state: FinanceState, action: AppAction) => reduceFinance(state, action, now);
describe('finance reducer', () => {
  it('adds a real transaction immutably with one revision and stable creation time', () => {
    const state = seed();
    const next = apply(state, { type: 'transaction.save', value: entry() });
    expect(state.transactions).toHaveLength(0);
    expect(next.transactions).toHaveLength(1);
    expect(next.revision).toBe(1);
    expect(next.transactions[0]).toMatchObject({ amountKobo: 50000, createdAt: '2026-10-26T12:00:00.000Z', deletedAt: null });
  });
});
