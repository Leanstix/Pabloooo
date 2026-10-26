import { expect, it } from 'vitest';
import { initialState } from '../../src/domain/initial';

it('seeds useful categories without inventing any financial activity', () => {
  const state = initialState('test-installation', '2026-01-01T00:00:00Z');
  expect(state.transactions).toEqual([]);
  expect(state.budgets).toEqual([]);
  expect(state.goals).toEqual([]);
  expect(state.recurringRules).toEqual([]);
  expect(state.settings.plannedIncomeKobo).toBe(0);
  expect(state.categories.map((category) => category.name)).toEqual(
    expect.arrayContaining([
      'Feeding',
      'Transportation',
      'Skincare',
      'Giving',
      'Pleasure',
      'Unforeseen',
    ]),
  );
});

it('rejects invalid installation identifiers and rolled-over initialization dates', () => {
  expect(() => initialState('../unsafe', '2026-01-01T00:00:00Z')).toThrow(/ID/);
  expect(() => initialState('valid', '2026-02-30T00:00:00Z')).toThrow(/time/);
  expect(() => initialState('valid', 'tomorrow')).toThrow(/time/);
  expect(() => initialState('valid', new Date('invalid'))).toThrow(/time/);
});
