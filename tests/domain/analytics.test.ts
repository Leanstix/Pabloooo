import { describe, expect, it } from 'vitest';
import { initialState, reduceFinance, summarize, categoryBreakdown, chartSeries, recurringSummary, suggestCategory, budgetProgress, plan, reportRange } from '../../src/domain';
import type { FinanceState, TransactionInput } from '../../src/domain';
const now = '2026-10-26T12:00:00Z';
const seed = () => initialState('analytics-test', now);
const range = reportRange('month', '2026-10-26');
function add(state: FinanceState, input: Partial<TransactionInput> = {}) {
  return reduceFinance(state, { type: 'transaction.save', value: { id: `t${state.revision}`, kind: 'expense', amountKobo: 50000, categoryId: 'category-feeding', occurredAt: now, note: 'Lunch', merchant: 'Mama Put', recurringId: null, ...input } }, now);
}
describe('financial analytics', () => {
  it('reports genuine zeros for an empty ledger', () => {
    expect(summarize(seed(), range)).toEqual({ incomeKobo: 0, expenseKobo: 0, balanceKobo: 0, count: 0 });
    expect(categoryBreakdown(seed(), range).every(row => row.amountKobo === 0 && row.percentOfIncome === null)).toBe(true);
  });
});

it('reconciles income expenses balance and count after soft deletion and restore', () => {
  let state = add(add(seed()), { kind: 'income', categoryId: 'category-salary', amountKobo: 250000 });
  expect(summarize(state, range)).toEqual({ incomeKobo: 250000, expenseKobo: 50000, balanceKobo: 200000, count: 2 });
  state = reduceFinance(state, { type: 'transaction.delete', id: 't0' }, now);
  expect(summarize(state, range)).toEqual({ incomeKobo: 250000, expenseKobo: 0, balanceKobo: 250000, count: 1 });
  state = reduceFinance(state, { type: 'transaction.restore', id: 't0' }, now);
  expect(summarize(state, range).expenseKobo).toBe(50000);
});

it('includes the first local midnight and excludes the next period midnight', () => {
  const state = add(add(seed(), { occurredAt: new Date(2026, 9, 1).toISOString(), amountKobo: 123 }), { occurredAt: new Date(2026, 10, 1).toISOString(), amountKobo: 456 });
  expect(summarize(state, range)).toEqual({ incomeKobo: 0, expenseKobo: 123, balanceKobo: -123, count: 1 });
});
