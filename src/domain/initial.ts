import type { Category, FinanceState } from './types';
import { timestamp } from './dates';

const defaults = [
  ['salary', 'Salary', 'income', '#16A34A', 'briefcase'],
  ['business', 'Business', 'income', '#0D9488', 'storefront'],
  ['gifts', 'Gifts & other income', 'income', '#0891B2', 'gift'],
  ['feeding', 'Feeding', 'expense', '#EA580C', 'restaurant'],
  ['transportation', 'Transportation', 'expense', '#2563EB', 'bus'],
  ['skincare', 'Skincare', 'expense', '#DB2777', 'sparkles'],
  ['giving', 'Giving', 'expense', '#9333EA', 'heart'],
  ['pleasure', 'Pleasure', 'expense', '#D97706', 'happy'],
  ['unforeseen', 'Unforeseen', 'expense', '#64748B', 'umbrella'],
  ['housing', 'Housing', 'expense', '#4F46E5', 'home'],
  ['utilities', 'Utilities', 'expense', '#0F766E', 'flash'],
  ['health', 'Health', 'expense', '#E11D48', 'medkit'],
] as const;

/** Only categories are seeded: first-run balances and ledgers are genuinely empty. */
export function initialState(
  installationId: string,
  now: Date | string = new Date(),
): FinanceState {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(installationId))
    throw new Error('Invalid installation ID.');
  const createdAt = timestamp(now);
  const categories: Category[] = defaults.map(([id, name, kind, color, icon]) => ({
    id: `category-${id}`,
    name,
    kind,
    color,
    icon,
    parentId: null,
    archived: false,
    createdAt,
    updatedAt: createdAt,
  }));
  return {
    schemaVersion: 1,
    revision: 0,
    installationId,
    transactions: [],
    categories,
    budgets: [],
    recurringRules: [],
    goals: [],
    settings: {
      currency: 'NGN',
      cycleStartDay: 1,
      plannedIncomeKobo: 0,
      theme: 'system',
      remindersEnabled: false,
      morningTime: '08:00',
      eveningTime: '20:00',
      onboardingComplete: false,
    },
  };
}
