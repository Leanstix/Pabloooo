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
