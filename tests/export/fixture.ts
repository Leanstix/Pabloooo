import type { FinanceState, Transaction } from '../../src/domain/types';
const stamp = '2026-10-01T12:00:00.000Z';
export function transaction(id: string, kind: 'income' | 'expense', amountKobo: number, categoryId: string, occurredAt = stamp): Transaction {
  return { id, kind, amountKobo, categoryId, occurredAt, note: '', merchant: '', recurringId: null, createdAt: stamp, updatedAt: stamp, deletedAt: null };
}
export function fixture(): FinanceState {
  return {
    schemaVersion: 1, revision: 4, installationId: 'test-install',
    settings: { currency: 'NGN', cycleStartDay: 1, plannedIncomeKobo: 90000000, theme: 'system', remindersEnabled: false, morningTime: '08:00', eveningTime: '20:00', onboardingComplete: true },
    categories: [
      { id: 'salary', name: 'Salary', kind: 'income', parentId: null, color: '#fff', icon: 'cash', archived: false, createdAt: stamp, updatedAt: stamp },
      { id: 'food', name: 'Food & drink', kind: 'expense', parentId: null, color: '#fff', icon: 'food', archived: false, createdAt: stamp, updatedAt: stamp },
      { id: 'dining', name: 'Dining', kind: 'expense', parentId: 'food', color: '#fff', icon: 'food', archived: false, createdAt: stamp, updatedAt: stamp },
    ],
    transactions: [transaction('in-1', 'income', 10000000, 'salary'), transaction('out-1', 'expense', 120055, 'dining'), transaction('out-2', 'expense', 99945, 'food')],
    budgets: [{ id: 'budget-1', categoryId: 'food', limitKobo: 300000, cycleKey: '2026-10-01', createdAt: stamp, updatedAt: stamp }],
    recurringRules: [{ id: 'rule-1', name: 'Food box', kind: 'expense', amountKobo: 50000, categoryId: 'food', frequency: 'weekly', nextDueDate: '2026-10-27', active: true, createdAt: stamp, updatedAt: stamp }], goals: [],
  };
}
