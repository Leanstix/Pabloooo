import { initialState } from '../../src/domain/initial';
import type { FinanceState } from '../../src/domain/types';
export function fixtureState(revision = 0): FinanceState {
  const state = initialState('local-test-installation', '2026-10-26T08:00:00.000Z');
  state.revision = revision;
  const stamp = '2026-10-26T08:00:00.000Z';
  state.transactions.push({
    id: 'transaction-a',
    kind: 'expense',
    amountKobo: 129950,
    categoryId: 'category-feeding',
    note: 'Rice & beans 🍚',
    merchant: 'Corner market',
    occurredAt: stamp,
    recurringId: null,
    createdAt: stamp,
    updatedAt: stamp,
    deletedAt: stamp,
  });
  state.budgets.push({
    id: 'budget-a',
    categoryId: 'category-feeding',
    limitKobo: 800000,
    cycleKey: '2026-10-01',
    createdAt: stamp,
    updatedAt: stamp,
  });
  state.goals.push({
    id: 'goal-a',
    name: 'Rainy day',
    targetKobo: 10000000,
    savedKobo: 200000,
    targetDate: '2027-01-01',
    createdAt: stamp,
    updatedAt: stamp,
  });
  state.recurringRules.push({
    id: 'rule-a',
    name: 'Salary',
    kind: 'income',
    amountKobo: 20000000,
    categoryId: 'category-salary',
    frequency: 'monthly',
    nextDueDate: '2026-11-01',
    active: true,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return state;
}
export function pngHeader(width = 256, height = 256): Uint8Array {
  const header = new Uint8Array(33);
  header.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(header.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return header;
}
