import { describe, expect, it } from 'vitest';
import { categoryFrequency, initialState, reduceFinance, reportRange } from '../../src/domain';
import type { FinanceState, TransactionInput } from '../../src/domain';

const now = '2026-10-26T12:00:00Z';
const range = reportRange('month', '2026-10-26');
const fresh = () => initialState('frequency-test', now);
function add(state: FinanceState, input: Partial<TransactionInput> = {}): FinanceState {
  return reduceFinance(state, { type: 'transaction.save', value: {
    id: `entry-${state.revision}`, kind: 'expense', amountKobo: 100,
    categoryId: 'category-feeding', note: '', merchant: '', occurredAt: '2026-10-26',
    recurringId: null, ...input,
  } }, now);
}

describe('actual category activity frequency', () => {
  it('returns useful empty statistics and validates both category and range', () => {
    expect(categoryFrequency(fresh(), 'category-feeding', range)).toEqual({ count: 0, activeDays: 0, averageKobo: 0, averageGapDays: null, recurringCount: 0 });
    expect(() => categoryFrequency(fresh(), 'missing', range)).toThrow(/Category/);
    expect(() => categoryFrequency(fresh(), 'category-feeding', { start: range.end, end: range.start })).toThrow(/range/);
  });
});
