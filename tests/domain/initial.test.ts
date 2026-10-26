import { expect, it } from 'vitest';
import { initialState } from '../../src/domain/initial';

it('seeds useful categories without inventing any financial activity', () => {
  const state = initialState('test-installation', '2026-01-01T00:00:00Z');
  expect(state.transactions).toEqual([]);
  expect(state.budgets).toEqual([]);
  expect(state.goals).toEqual([]);
  expect(state.recurringRules).toEqual([]);
  expect(state.settings.plannedIncomeKobo).toBe(0);
  expect(state.categories.map(category => category.name)).toEqual(expect.arrayContaining([
    'Feeding', 'Transportation', 'Skincare', 'Giving', 'Pleasure', 'Unforeseen',
  ]));
});
