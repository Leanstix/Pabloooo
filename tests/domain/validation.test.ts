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
