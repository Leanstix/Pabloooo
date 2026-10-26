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

it('plots complete calendar month buckets for quarterly and yearly reports', () => {
  const state = add(add(seed(), { occurredAt: '2026-11-01', amountKobo: 10000 }), { occurredAt: '2026-12-31', amountKobo: 20000 });
  expect(chartSeries(state, reportRange('quarter', '2026-12-10'), 'month')).toEqual([
    { key: '2026-10', incomeKobo: 0, expenseKobo: 0 },
    { key: '2026-11', incomeKobo: 0, expenseKobo: 10000 },
    { key: '2026-12', incomeKobo: 0, expenseKobo: 20000 },
  ]);
  expect(chartSeries(state, reportRange('year', '2026-10-26'), 'month')).toHaveLength(12);
});

it('counts child expenses against the parent budget and preserves negative remaining', () => {
  let state = reduceFinance(seed(), { type: 'category.save', value: { id: 'snacks', name: 'Snacks', kind: 'expense', parentId: 'category-feeding', color: '#123456', icon: 'cafe', archived: false } }, now);
  state = reduceFinance(state, { type: 'budget.save', value: { id: 'b1', categoryId: 'category-feeding', limitKobo: 10000, cycleKey: '2026-10-01' } }, now);
  state = add(state, { categoryId: 'snacks', amountKobo: 15000 });
  expect(budgetProgress(state, '2026-10-26')).toEqual([{ id: 'b1', categoryId: 'category-feeding', limitKobo: 10000, spentKobo: 15000, remainingKobo: -5000, percent: 150 }]);
  expect(budgetProgress(state, '2026-11-01')).toEqual([]);
});

it('forecasts confirmed-date anchors across short months without mutating the ledger', () => {
  const state = reduceFinance(seed(), { type: 'recurring.save', value: { id: 'r1', name: 'Membership', kind: 'expense', amountKobo: 1000, categoryId: 'category-pleasure', frequency: 'monthly', nextDueDate: '2026-01-31', active: true } }, now);
  const before = JSON.stringify(state);
  const forecast = recurringSummary(state, reportRange('quarter', '2026-01-01'));
  expect(forecast.occurrences.map(row => row.date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  expect(forecast).toMatchObject({ incomeKobo: 0, expenseKobo: 3000, netKobo: -3000 });
  expect(JSON.stringify(state)).toBe(before);
  expect(state.transactions).toHaveLength(0);
});

it('excludes paused rules and totals recurring income separately from expense', () => {
  let state = reduceFinance(seed(), { type: 'recurring.save', value: { id: 'salary', name: 'Pay', kind: 'income', amountKobo: 100000, categoryId: 'category-salary', frequency: 'monthly', nextDueDate: '2026-10-26', active: true } }, now);
  state = reduceFinance(state, { type: 'recurring.save', value: { id: 'paused', name: 'Paused', kind: 'expense', amountKobo: 1000, categoryId: 'category-pleasure', frequency: 'daily', nextDueDate: '2026-10-01', active: false } }, now);
  expect(recurringSummary(state, range)).toMatchObject({ incomeKobo: 100000, expenseKobo: 0, netKobo: 100000 });
  expect(recurringSummary(state, range).occurrences).toHaveLength(1);
});

it('uses normalized merchant history and frequency before recency', () => {
  let state = add(add(seed(), { id: 'a', merchant: 'Corner Shop', categoryId: 'category-feeding', occurredAt: '2026-10-01' }), { id: 'b', merchant: 'corner shop', categoryId: 'category-feeding', occurredAt: '2026-10-02' });
  state = add(state, { id: 'c', merchant: 'CORNER SHOP', categoryId: 'category-pleasure', occurredAt: '2026-10-26' });
  expect(suggestCategory(state, { note: '', merchant: '  Corner   Shop ', kind: 'expense' })).toBe('category-feeding');
  expect(suggestCategory(state, { note: '', merchant: 'Corner Shop', kind: 'income' })).toBeNull();
  expect(suggestCategory(state, { note: '', merchant: '', kind: 'expense' })).toBeNull();
});

it('uses recent note matches and excludes deleted or archived history', () => {
  let state = add(add(seed(), { id: 'old', note: 'Coffee', merchant: '', categoryId: 'category-feeding', occurredAt: '2026-10-01' }), { id: 'recent', note: 'coffee', merchant: '', categoryId: 'category-pleasure', occurredAt: '2026-10-26' });
  const query = { note: '  COFFEE ', merchant: '', kind: 'expense' as const };
  expect(suggestCategory(state, query)).toBe('category-pleasure');
  state = reduceFinance(state, { type: 'transaction.delete', id: 'recent' }, now);
  expect(suggestCategory(state, query)).toBe('category-feeding');
  state = reduceFinance(state, { type: 'category.archive', id: 'category-feeding' }, now);
  expect(suggestCategory(state, query)).toBeNull();
});

it('calculates available daily money including today and upcoming confirmed templates', () => {
  let state = reduceFinance(seed(), { type: 'settings.update', value: { plannedIncomeKobo: 1000000 } }, now);
  state = add(state, { amountKobo: 400000 });
  state = reduceFinance(state, { type: 'recurring.save', value: { id: 'bill', name: 'Bill', kind: 'expense', amountKobo: 60000, categoryId: 'category-utilities', frequency: 'monthly', nextDueDate: '2026-10-30', active: true } }, now);
  expect(plan(state, '2026-10-26')).toMatchObject({ plannedIncomeKobo: 1000000, spentKobo: 400000, projectedExpenseKobo: 460000, remainingKobo: 540000, daysRemaining: 6, dailyAvailableKobo: 90000 });
});

it('applies what-if income and expenses without changing persistent state', () => {
  let state = add(seed(), { kind: 'income', categoryId: 'category-salary', amountKobo: 100000 });
  state = add(state, { amountKobo: 40000 });
  const before = JSON.stringify(state);
  expect(plan(state, '2026-10-31', { additionalIncomeKobo: 20000, additionalExpenseKobo: 5000 })).toMatchObject({ plannedIncomeKobo: 120000, projectedExpenseKobo: 45000, remainingKobo: 75000, daysRemaining: 1, dailyAvailableKobo: 75000 });
  expect(JSON.stringify(state)).toBe(before);
  expect(() => plan(state, '2026-10-31', { additionalExpenseKobo: -1 })).toThrow();
  expect(() => plan(state, '2026-10-31', { additionalIncomeKobo: Number.MAX_SAFE_INTEGER })).toThrow(/safe range/);
});
