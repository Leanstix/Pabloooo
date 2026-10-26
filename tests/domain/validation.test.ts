import { describe, expect, it } from 'vitest';
import { initialState } from '../../src/domain/initial';
import { validateFinanceState } from '../../src/domain/validation';

const seed = () => initialState('validation-test', '2026-01-01T00:00:00Z');
describe('backup validation', () => {
  it('accepts a well-formed initial ledger and its JSON round trip', () => {
    const state = seed();
    expect(validateFinanceState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});

it('rejects future schemas and fractional negative or unsafe revisions', () => {
  for (const schemaVersion of [0, 2, '1', null]) expect(() => validateFinanceState({ ...seed(), schemaVersion })).toThrow();
  for (const revision of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, '0']) expect(() => validateFinanceState({ ...seed(), revision })).toThrow();
});

it('rejects missing and unknown fields at the root and in settings', () => {
  const state = seed();
  const { goals: _goals, ...missing } = state;
  expect(() => validateFinanceState(missing)).toThrow(/fields/);
  expect(() => validateFinanceState({ ...state, injected: true })).toThrow(/fields/);
  expect(() => validateFinanceState({ ...state, settings: { ...state.settings, currency: 'USD' } })).toThrow(/NGN/);
  expect(() => validateFinanceState({ ...state, settings: { ...state.settings, injected: true } })).toThrow(/fields/);
});

it('rejects duplicate entity IDs and IDs with path or control characters', () => {
  const state = seed();
  expect(() => validateFinanceState({ ...state, categories: [...state.categories, state.categories[0]] })).toThrow(/Duplicate/);
  for (const installationId of ['../secret', '', 'with spaces', '__proto__', 'x\n']) expect(() => validateFinanceState({ ...state, installationId })).toThrow(/ID/);
  expect(() => validateFinanceState({ ...state, categories: state.categories.map((row, i) => i ? row : { ...row, id: 'a/b' }) })).toThrow(/ID/);
});

it('rejects orphan parents cycles and active children of archived parents', () => {
  const state = seed();
  const parent = state.categories[3]!;
  const child = { ...parent, id: 'child', name: 'Child', parentId: parent.id };
  expect(() => validateFinanceState({ ...state, categories: [...state.categories, { ...child, parentId: 'missing' }] })).toThrow();
  expect(() => validateFinanceState({ ...state, categories: [...state.categories, { ...child, parentId: 'child' }] })).toThrow();
  expect(() => validateFinanceState({ ...state, categories: [...state.categories.map(row => row.id === parent.id ? { ...row, archived: true } : row), child] })).toThrow(/archived parent/);
});

it('rejects fractional kobo and malformed goals rather than coercing values', () => {
  const state = seed();
  const goal = { id: 'g1', name: 'Safety', targetKobo: 10000, savedKobo: 0, targetDate: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
  for (const targetKobo of [0, -1, 1.5, NaN, Infinity, '100']) expect(() => validateFinanceState({ ...state, goals: [{ ...goal, targetKobo }] })).toThrow();
  expect(() => validateFinanceState({ ...state, goals: [{ ...goal, savedKobo: -1 }] })).toThrow();
  expect(() => validateFinanceState({ ...state, settings: { ...state.settings, plannedIncomeKobo: 1.5 } })).toThrow();
});

it('rejects transaction references to missing categories or recurring rules', () => {
  const state = seed();
  const transaction = { id: 't1', kind: 'expense', amountKobo: 100, categoryId: 'category-feeding', note: '', merchant: '', occurredAt: '2026-01-01', recurringId: null, deletedAt: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
  expect(() => validateFinanceState({ ...state, transactions: [{ ...transaction, categoryId: 'missing' }] })).toThrow(/reference/);
  expect(() => validateFinanceState({ ...state, transactions: [{ ...transaction, recurringId: 'missing' }] })).toThrow(/recurring rule reference/);
  expect(() => validateFinanceState({ ...state, transactions: [{ ...transaction, kind: 'income' }] })).toThrow(/wrong kind/);
});

it('rejects oversized arrays and excessively long category text', () => {
  const state = seed();
  expect(() => validateFinanceState({ ...state, categories: Array(2001).fill(state.categories[0]) })).toThrow(/size/);
  expect(() => validateFinanceState({ ...state, categories: state.categories.map((row, i) => i ? row : { ...row, name: 'a'.repeat(101) }) })).toThrow(/name/);
  expect(() => validateFinanceState({ ...state, categories: state.categories.map((row, i) => i ? row : { ...row, color: 'red' }) })).toThrow(/color/);
});

it('rejects invalid calendar metadata and timestamps before entity creation', () => {
  const state = seed();
  for (const updatedAt of ['2026-02-30T00:00:00Z', '2026-01-01', '2025-12-31T23:59:59Z']) {
    expect(() => validateFinanceState({ ...state, categories: state.categories.map((row, i) => i ? row : { ...row, updatedAt }) })).toThrow();
  }
});

it('accepts legacy recurring rules while rejecting invalid optional anchors', () => {
  const state = seed();
  const rule = { id: 'r1', name: 'Membership', kind: 'expense', amountKobo: 1000, categoryId: 'category-pleasure', frequency: 'monthly', nextDueDate: '2026-01-31', active: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
  expect(() => validateFinanceState({ ...state, recurringRules: [rule] })).not.toThrow();
  expect(() => validateFinanceState({ ...state, recurringRules: [{ ...rule, anchorDate: '2026-02-30' }] })).toThrow(/anchor/);
  expect(() => validateFinanceState({ ...state, recurringRules: [{ ...rule, anchorDate: '2026-01-31' }] })).not.toThrow();
});

it('rejects prototype-bearing objects and string boolean settings', () => {
  class FakeState { schemaVersion = 1; }
  expect(() => validateFinanceState(new FakeState())).toThrow(/object/);
  expect(() => validateFinanceState(null)).toThrow(/object/);
  expect(() => validateFinanceState([])).toThrow(/object/);
  expect(() => validateFinanceState({ ...seed(), settings: { ...seed().settings, remindersEnabled: 'false' } })).toThrow(/boolean/);
});

it('rejects active recurring rules on archived categories but permits inactive history', () => {
  const state = seed();
  const categories = state.categories.map(row => row.id === 'category-pleasure' ? { ...row, archived: true } : row);
  const rule = { id: 'r1', name: 'Membership', kind: 'expense', amountKobo: 1000, categoryId: 'category-pleasure', frequency: 'monthly', nextDueDate: '2026-01-31', active: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
  expect(() => validateFinanceState({ ...state, categories, recurringRules: [rule] })).toThrow(/archived category/);
  expect(() => validateFinanceState({ ...state, categories, recurringRules: [{ ...rule, active: false }] })).not.toThrow();
});
