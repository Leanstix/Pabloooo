import type { Category, DateRange, FinanceState, Transaction } from '../domain/types';

export function addKobo(a: number, b: number): number {
  const value = a + b;
  if (!Number.isSafeInteger(value)) throw new Error('Currency total exceeds safe integer kobo');
  return value;
}
export function sumKobo(rows: Transaction[]): number {
  return rows.reduce((sum, row) => addKobo(sum, row.amountKobo), 0);
}
export function validDate(value: unknown, field: string): number {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error(`Invalid ${field}`);
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  if (month < 1 || month > 12 || day < 1 || day > days) throw new Error(`Invalid ${field}`);
  return Date.parse(value);
}
function amount(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`Invalid ${field}: expected non-negative safe integer kobo`);
}
export function validateState(state: FinanceState): void {
  if (!state || state.schemaVersion !== 1 || !state.settings || state.settings.currency !== 'NGN')
    throw new Error('Unsupported finance state');
  for (const key of ['transactions', 'categories', 'budgets', 'recurringRules', 'goals'] as const) {
    if (!Array.isArray(state[key])) throw new Error(`Invalid ${key}`);
    const ids = new Set<string>();
    for (const item of state[key]) {
      if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id))
        throw new Error(`Invalid or duplicate ${key} identifier`);
      ids.add(item.id);
    }
  }
  if (
    !Number.isInteger(state.settings.cycleStartDay) ||
    state.settings.cycleStartDay < 1 ||
    state.settings.cycleStartDay > 31
  )
    throw new Error('Invalid cycle start day');
  amount(state.settings.plannedIncomeKobo, 'planned income');
  for (const tx of state.transactions.filter((row) => !row.deletedAt)) {
    amount(tx.amountKobo, 'transaction amount');
    validDate(tx.occurredAt, 'transaction timestamp');
    if (tx.kind !== 'income' && tx.kind !== 'expense') throw new Error('Invalid transaction kind');
    for (const key of ['note', 'merchant', 'categoryId', 'createdAt', 'updatedAt'] as const)
      if (typeof tx[key] !== 'string') throw new Error(`Invalid transaction ${key}`);
  }
  for (const row of state.budgets) amount(row.limitKobo, 'budget limit');
  for (const row of state.recurringRules) {
    amount(row.amountKobo, 'recurring amount');
    validDate(row.nextDueDate, 'recurring due date');
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(row.frequency))
      throw new Error('Invalid recurrence frequency');
  }
}
export function selectedTransactions(state: FinanceState, range?: DateRange): Transaction[] {
  const start = range ? validDate(range.start, 'range start') : -Infinity;
  const end = range ? validDate(range.end, 'range end') : Infinity;
  if (start >= end) throw new Error('Export range start must precede end');
  return state.transactions
    .filter(
      (row) =>
        !row.deletedAt && Date.parse(row.occurredAt) >= start && Date.parse(row.occurredAt) < end,
    )
    .slice()
    .sort(
      (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.id.localeCompare(b.id),
    );
}
export function categoryLabels(
  id: string,
  categories: Category[],
): { parent: string; child: string; full: string } {
  const category = categories.find((row) => row.id === id);
  if (!category) return { parent: 'Unknown category', child: '', full: 'Unknown category' };
  const names = [category.name];
  const seen = new Set([id]);
  let parent = category.parentId;
  while (parent) {
    if (seen.has(parent)) throw new Error('Category hierarchy contains a cycle');
    seen.add(parent);
    const item = categories.find((row) => row.id === parent);
    if (!item) break;
    names.unshift(item.name);
    parent = item.parentId;
  }
  return {
    parent: names[0] ?? category.name,
    child: names.length > 1 ? names.slice(1).join(' / ') : '',
    full: names.join(' / '),
  };
}
