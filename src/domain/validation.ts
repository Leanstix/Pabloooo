import type { FinanceState } from './types';
import { assertKobo, sumKobo } from './money';
import { isDate, isDateTime, isTimestamp } from './dates';

type RecordValue = Record<string, unknown>;
function fail(message: string): never { throw new Error(`Invalid finance data: ${message}`); }
function object(value: unknown, keys: string[], label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(`${label} must be an object.`);
  const record = value as RecordValue;
  if (Object.keys(record).length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(record, key))) fail(`${label} has missing or unexpected fields.`);
  return record;
}
function string(value: unknown, max: number, label: string, nonempty = false): asserts value is string {
  if (typeof value !== 'string' || value.length > max || (nonempty && !value.trim()) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) fail(`${label} is invalid.`);
}
function id(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) fail('Unsafe ID.');
}
function bool(value: unknown): void { if (typeof value !== 'boolean') fail('Expected a boolean.'); }
function oneOf(value: unknown, allowed: readonly unknown[], label: string): void { if (!allowed.includes(value)) fail(`Unknown ${label}.`); }
function stamp(value: unknown): void { if (!isTimestamp(value)) fail('Invalid timestamp.'); }
function metadata(row: RecordValue): void {
  id(row.id); stamp(row.createdAt); stamp(row.updatedAt);
  if (Date.parse(row.updatedAt as string) < Date.parse(row.createdAt as string)) fail('Updated time precedes creation.');
}
function rows(value: unknown, max: number, keys: string[], label: string): RecordValue[] {
  if (!Array.isArray(value) || value.length > max) fail(`${label} exceeds supported size or is not an array.`);
  const seen = new Set<string>();
  return value.map(item => {
    const row = object(item, keys, label);
    metadata(row);
    if (seen.has(row.id as string)) fail(`Duplicate ${label} ID.`);
    seen.add(row.id as string);
    return row;
  });
}
const kind = (value: unknown) => oneOf(value, ['income', 'expense'], 'entry kind');
const common = ['id', 'createdAt', 'updatedAt'];

/** Strict all-or-nothing validation before import or persistence. No orphan references. */
export function validateFinanceState(value: unknown): FinanceState {
  const state = object(value, ['schemaVersion', 'revision', 'installationId', 'transactions', 'categories', 'budgets', 'recurringRules', 'goals', 'settings'], 'State');
  if (state.schemaVersion !== 1) fail('Unsupported schema version.');
  if (!Number.isSafeInteger(state.revision) || (state.revision as number) < 0) fail('Invalid revision.');
  id(state.installationId);
  const categories = rows(state.categories, 2000, [...common, 'name', 'kind', 'parentId', 'color', 'icon', 'archived'], 'category');
  const categoryMap = new Map(categories.map(row => [row.id, row]));
  for (const category of categories) {
    string(category.name, 100, 'Category name', true); kind(category.kind); bool(category.archived);
    string(category.icon, 64, 'Category icon', true);
    if (typeof category.color !== 'string' || !/^#[\da-fA-F]{6}$/.test(category.color)) fail('Category color must be a six-digit hex color.');
    if (category.parentId !== null) {
      id(category.parentId);
      const parent = categoryMap.get(category.parentId);
      if (!parent || parent.id === category.id || parent.parentId !== null || parent.kind !== category.kind) fail('Category parent is missing, cyclic, too deep, or has another kind.');
      if (parent.archived && !category.archived) fail('Active subcategory has an archived parent.');
    }
  }
  const reference = (row: RecordValue, expenseOnly = false): void => {
    id(row.categoryId);
    const category = categoryMap.get(row.categoryId);
    if (!category || (expenseOnly ? category.kind !== 'expense' : row.kind !== category.kind)) fail('Category reference is missing or has the wrong kind.');
  };
  const rules = rows(state.recurringRules, 5000, [...common, 'name', 'kind', 'amountKobo', 'categoryId', 'frequency', 'nextDueDate', 'active'], 'recurring rule');
  const ruleMap = new Map(rules.map(row => [row.id, row]));
  for (const rule of rules) {
    string(rule.name, 200, 'Recurring name', true); kind(rule.kind); reference(rule);
    assertKobo(rule.amountKobo, 'Recurring amount', false);
    oneOf(rule.frequency, ['daily', 'weekly', 'monthly', 'yearly'], 'frequency');
    if (!isDate(rule.nextDueDate)) fail('Invalid recurring due date.');
    bool(rule.active);
  }
  const transactions = rows(state.transactions, 100000, [...common, 'kind', 'amountKobo', 'categoryId', 'note', 'merchant', 'occurredAt', 'recurringId', 'deletedAt'], 'transaction');
  for (const transaction of transactions) {
    kind(transaction.kind); reference(transaction); assertKobo(transaction.amountKobo, 'Transaction amount', false);
    string(transaction.note, 4000, 'Transaction note'); string(transaction.merchant, 200, 'Merchant');
    if (!isDateTime(transaction.occurredAt)) fail('Invalid transaction date.');
    if (transaction.deletedAt !== null) stamp(transaction.deletedAt);
    if (transaction.recurringId !== null) {
      id(transaction.recurringId);
      if (!ruleMap.has(transaction.recurringId)) fail('Missing recurring rule reference.');
    }
  }
  // Prevent later reports from silently rounding sums even when every individual entry is safe.
  sumKobo(transactions.filter(row => row.deletedAt === null && row.kind === 'income').map(row => row.amountKobo as number));
  sumKobo(transactions.filter(row => row.deletedAt === null && row.kind === 'expense').map(row => row.amountKobo as number));
  const budgets = rows(state.budgets, 10000, [...common, 'categoryId', 'limitKobo', 'cycleKey'], 'budget');
  const budgetKeys = new Set<string>();
  for (const budget of budgets) {
    reference(budget, true); assertKobo(budget.limitKobo, 'Budget limit', false);
    if (!isDate(budget.cycleKey)) fail('Invalid budget cycle key.');
    const key = `${budget.categoryId}/${budget.cycleKey}`;
    if (budgetKeys.has(key)) fail('Duplicate budget category in a cycle.');
    budgetKeys.add(key);
  }
  const goals = rows(state.goals, 5000, [...common, 'name', 'targetKobo', 'savedKobo', 'targetDate'], 'goal');
  for (const goal of goals) {
    string(goal.name, 200, 'Goal name', true); assertKobo(goal.targetKobo, 'Goal target', false); assertKobo(goal.savedKobo, 'Goal savings');
    if (goal.targetDate !== null && !isDate(goal.targetDate)) fail('Invalid goal date.');
  }
  const settings = object(state.settings, ['currency', 'cycleStartDay', 'plannedIncomeKobo', 'theme', 'remindersEnabled', 'morningTime', 'eveningTime', 'onboardingComplete'], 'Settings');
  if (settings.currency !== 'NGN') fail('Currency must be NGN.');
  if (!Number.isInteger(settings.cycleStartDay) || (settings.cycleStartDay as number) < 1 || (settings.cycleStartDay as number) > 31) fail('Cycle start must be 1–31.');
  assertKobo(settings.plannedIncomeKobo, 'Planned income');
  oneOf(settings.theme, ['system', 'light', 'dark'], 'theme'); bool(settings.remindersEnabled); bool(settings.onboardingComplete);
  for (const time of [settings.morningTime, settings.eveningTime]) if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) fail('Reminder time must be HH:mm.');
  return value as FinanceState;
}
