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
