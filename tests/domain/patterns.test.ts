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

it('includes direct and child entries while keeping child-only queries scoped', () => {
  let state = reduceFinance(fresh(), { type: 'category.save', value: { id: 'snacks', name: 'Snacks', kind: 'expense', parentId: 'category-feeding', color: '#123456', icon: 'cafe', archived: false } }, now);
  state = add(state, { amountKobo: 100, occurredAt: '2026-10-01' });
  state = add(state, { amountKobo: 200, occurredAt: '2026-10-03', categoryId: 'snacks' });
  state = add(state, { amountKobo: 300, occurredAt: '2026-10-07', categoryId: 'snacks' });
  state = add(state, { amountKobo: 999, categoryId: 'category-transportation' });
  expect(categoryFrequency(state, 'category-feeding', range)).toEqual({ count: 3, activeDays: 3, averageKobo: 200, averageGapDays: 3, recurringCount: 0 });
  expect(categoryFrequency(state, 'snacks', range)).toEqual({ count: 2, activeDays: 2, averageKobo: 250, averageGapDays: 4, recurringCount: 0 });
});

it('keeps one active day and no gap estimate for repeated same-day entries', () => {
  const single = add(fresh(), { amountKobo: 101 });
  expect(categoryFrequency(single, 'category-feeding', range)).toEqual({ count: 1, activeDays: 1, averageKobo: 101, averageGapDays: null, recurringCount: 0 });
  const repeated = add(single, { amountKobo: 102 });
  expect(categoryFrequency(repeated, 'category-feeding', range)).toEqual({ count: 2, activeDays: 1, averageKobo: 102, averageGapDays: null, recurringCount: 0 });
});
