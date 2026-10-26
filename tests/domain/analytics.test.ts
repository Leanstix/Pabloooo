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

it('rolls subcategory spending into its parent and uses actual income for percentages', () => {
  let state = reduceFinance(seed(), { type: 'category.save', value: { id: 'snacks', name: 'Snacks', kind: 'expense', parentId: 'category-feeding', color: '#123456', icon: 'cafe', archived: false } }, now);
  state = add(add(add(state, { kind: 'income', categoryId: 'category-salary', amountKobo: 100000 }), { amountKobo: 50000 }), { categoryId: 'snacks', amountKobo: 75000 });
  const rows = categoryBreakdown(state, range);
  expect(rows.find(row => row.categoryId === 'category-feeding')).toMatchObject({ amountKobo: 125000, percentOfIncome: 125 });
  expect(rows.some(row => row.categoryId === 'snacks')).toBe(false);
  expect(rows.filter(row => row.kind === 'expense').reduce((sum, row) => sum + row.amountKobo, 0)).toBe(summarize(state, range).expenseKobo);
});

it('keeps historical archived categories visible and never divides by zero income', () => {
  let state = add(seed());
  state = reduceFinance(state, { type: 'category.archive', id: 'category-feeding' }, now);
  expect(categoryBreakdown(state, range).find(row => row.categoryId === 'category-feeding')).toMatchObject({ amountKobo: 50000, percentOfIncome: null });
  expect(summarize(state, range).expenseKobo).toBe(50000);
});

it('fills daily gaps with zero and reconciles every plotted amount to reports', () => {
  const state = add(add(seed(), { occurredAt: '2026-10-01', amountKobo: 12345 }), { occurredAt: '2026-10-31', kind: 'income', categoryId: 'category-salary', amountKobo: 99999 });
  const points = chartSeries(state, range, 'day');
  expect(points).toHaveLength(31);
  expect(points[0]).toEqual({ key: '2026-10-01', incomeKobo: 0, expenseKobo: 12345 });
  expect(points[1]).toEqual({ key: '2026-10-02', incomeKobo: 0, expenseKobo: 0 });
  expect(points.reduce((sum, row) => sum + row.incomeKobo, 0)).toBe(summarize(state, range).incomeKobo);
  expect(points.reduce((sum, row) => sum + row.expenseKobo, 0)).toBe(summarize(state, range).expenseKobo);
});

it('groups a daily report by local clock hour including empty hours', () => {
  const date = new Date(2026, 9, 26, 12, 30).toISOString();
  const state = add(seed(), { occurredAt: date });
  const points = chartSeries(state, reportRange('day', '2026-10-26'), 'hour');
  expect(points).toHaveLength(24);
  expect(points.find(row => row.key === '2026-10-26T12:00')?.expenseKobo).toBe(50000);
  expect(points.reduce((sum, row) => sum + row.expenseKobo, 0)).toBe(50000);
});
