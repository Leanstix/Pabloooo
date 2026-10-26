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

it('edits transaction amount without replacing creation metadata or duplicating records', () => {
  const state = apply(seed(), { type: 'transaction.save', value: entry() });
  const next = reduceFinance(state, { type: 'transaction.save', value: entry({ amountKobo: 70000, note: 'Dinner' }) }, '2026-10-27T12:00:00Z');
  expect(next.transactions).toHaveLength(1);
  expect(next.transactions[0]).toMatchObject({ createdAt: '2026-10-26T12:00:00.000Z', updatedAt: '2026-10-27T12:00:00.000Z', amountKobo: 70000, note: 'Dinner' });
  expect(state.transactions[0]?.amountKobo).toBe(50000);
  expect(next.revision).toBe(2);
});

it('rejects nonpositive fractional and unsafe amounts atomically', () => {
  const state = seed();
  const before = JSON.stringify(state);
  for (const amountKobo of [0, -100, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN]) expect(() => apply(state, { type: 'transaction.save', value: entry({ amountKobo }) })).toThrow();
  expect(JSON.stringify(state)).toBe(before);
  expect(state.revision).toBe(0);
});

it('requires an existing category of the same income or expense kind', () => {
  const state = seed();
  expect(() => apply(state, { type: 'transaction.save', value: entry({ categoryId: 'missing' }) })).toThrow();
  expect(() => apply(state, { type: 'transaction.save', value: entry({ categoryId: 'category-salary' }) })).toThrow();
  expect(() => apply(state, { type: 'transaction.save', value: entry({ occurredAt: '2026-02-30' }) })).toThrow();
});

it('soft deletes and restores the same transaction without losing its data', () => {
  const state = apply(seed(), { type: 'transaction.save', value: entry() });
  const removed = apply(state, { type: 'transaction.delete', id: 't1' });
  expect(removed.transactions[0]?.deletedAt).not.toBeNull();
  expect(apply(removed, { type: 'transaction.delete', id: 't1' })).toBe(removed);
  expect(() => apply(removed, { type: 'transaction.save', value: entry() })).toThrow(/Restore/);
  const restored = apply(removed, { type: 'transaction.restore', id: 't1' });
  expect(restored.transactions[0]).toEqual(state.transactions[0]);
  expect(apply(restored, { type: 'transaction.restore', id: 't1' })).toBe(restored);
});

it('blocks new archived-category entries while allowing historical edits and restores', () => {
  let state = apply(seed(), { type: 'transaction.save', value: entry() });
  state = apply(state, { type: 'category.archive', id: 'category-feeding' });
  expect(() => apply(state, { type: 'transaction.save', value: entry({ id: 'new' }) })).toThrow(/active/);
  state = apply(state, { type: 'transaction.save', value: entry({ note: 'Historical correction' }) });
  state = apply(state, { type: 'transaction.delete', id: 't1' });
  state = apply(state, { type: 'transaction.restore', id: 't1' });
  expect(state.transactions[0]?.note).toBe('Historical correction');
  expect(state.categories.find(row => row.id === 'category-feeding')?.archived).toBe(true);
});

it('creates a subcategory but rejects grandchildren and self-parenting', () => {
  const value = { id: 'snacks', name: 'Snacks', kind: 'expense' as const, parentId: 'category-feeding', color: '#123456', icon: 'cafe', archived: false };
  const state = apply(seed(), { type: 'category.save', value });
  expect(state.categories.find(row => row.id === 'snacks')?.parentId).toBe('category-feeding');
  expect(() => apply(state, { type: 'category.save', value: { ...value, id: 'crisps', name: 'Crisps', parentId: 'snacks' } })).toThrow();
  expect(() => apply(state, { type: 'category.save', value: { ...value, parentId: 'snacks' } })).toThrow();
});

it('rejects moving a parent below its child or below an income category', () => {
  const state = apply(seed(), { type: 'category.save', value: { id: 'snacks', name: 'Snacks', kind: 'expense', parentId: 'category-feeding', color: '#123456', icon: 'cafe', archived: false } });
  const parent = state.categories.find(row => row.id === 'category-feeding')!;
  const { createdAt: _created, updatedAt: _updated, ...value } = parent;
  expect(() => apply(state, { type: 'category.save', value: { ...value, parentId: 'snacks' } })).toThrow();
  expect(() => apply(state, { type: 'category.save', value: { ...value, parentId: 'category-salary' } })).toThrow();
});

it('archives child categories and deactivates their recurring rules together', () => {
  let state = apply(seed(), { type: 'category.save', value: { id: 'snacks', name: 'Snacks', kind: 'expense', parentId: 'category-feeding', color: '#123456', icon: 'cafe', archived: false } });
  state = apply(state, { type: 'recurring.save', value: { id: 'r1', name: 'Snack box', kind: 'expense', amountKobo: 1000, categoryId: 'snacks', frequency: 'weekly', nextDueDate: '2026-10-26', active: true } });
  state = apply(state, { type: 'category.archive', id: 'category-feeding' });
  expect(state.categories.find(row => row.id === 'snacks')?.archived).toBe(true);
  expect(state.recurringRules[0]?.active).toBe(false);
  expect(() => apply(state, { type: 'recurring.confirm', id: 'r1', transactionId: 't1', occurredAt: now })).toThrow(/inactive/);
});

it('prevents historical category type changes and duplicate sibling names', () => {
  const state = apply(seed(), { type: 'transaction.save', value: entry() });
  const value = { id: 'category-feeding', name: 'Feeding', kind: 'income' as const, parentId: null, color: '#123456', icon: 'cafe', archived: false };
  expect(() => apply(state, { type: 'category.save', value })).toThrow(/referenced/);
  expect(() => apply(state, { type: 'category.save', value: { ...value, id: 'copy', kind: 'expense', name: '  feeding  ' } })).toThrow(/already exists/);
});

it('stores one expense-category budget per cycle and rejects mismatched keys', () => {
  const value = { id: 'b1', categoryId: 'category-feeding', limitKobo: 200000, cycleKey: '2026-10-01' };
  const state = apply(seed(), { type: 'budget.save', value });
  expect(state.budgets[0]?.limitKobo).toBe(200000);
  expect(() => apply(state, { type: 'budget.save', value: { ...value, id: 'b2' } })).toThrow(/Duplicate/);
  expect(() => apply(state, { type: 'budget.save', value: { ...value, id: 'b2', cycleKey: '2026-10-02' } })).toThrow(/start of a cycle/);
  expect(() => apply(state, { type: 'budget.save', value: { ...value, categoryId: 'category-salary' } })).toThrow();
  expect(apply(state, { type: 'budget.delete', id: 'b1' }).budgets).toEqual([]);
});

it('creates one occurrence and advances its due date once under replay', () => {
  const state = apply(seed(), { type: 'recurring.save', value: { id: 'r1', name: 'Lunch subscription', kind: 'expense', amountKobo: 1000, categoryId: 'category-feeding', frequency: 'monthly', nextDueDate: '2026-10-26', active: true } });
  expect(state.transactions).toHaveLength(0);
  const action = { type: 'recurring.confirm' as const, id: 'r1', transactionId: 'confirmed', occurredAt: now };
  const next = apply(state, action);
  expect(next.transactions).toHaveLength(1);
  expect(next.transactions[0]).toMatchObject({ recurringId: 'r1', note: 'Lunch subscription', amountKobo: 1000 });
  expect(next.recurringRules[0]?.nextDueDate).toBe('2026-11-26');
  expect(apply(next, action)).toBe(next);
  expect(next.revision).toBe(state.revision + 1);
});

it('does not advance recurrence when confirmation fails validation', () => {
  let state = apply(seed(), { type: 'transaction.save', value: entry() });
  state = apply(state, { type: 'recurring.save', value: { id: 'r1', name: 'Rent', kind: 'expense', amountKobo: 1000, categoryId: 'category-housing', frequency: 'monthly', nextDueDate: '2026-10-27', active: true } });
  const before = JSON.stringify(state);
  expect(() => apply(state, { type: 'recurring.confirm', id: 'r1', transactionId: 't1', occurredAt: now })).toThrow(/already in use/);
  expect(() => apply(state, { type: 'recurring.confirm', id: 'r1', transactionId: 'new', occurredAt: now })).toThrow(/not due/);
  expect(JSON.stringify(state)).toBe(before);
});
