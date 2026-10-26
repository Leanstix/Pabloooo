import type { DateRange, EntryKind, FinanceState, Transaction } from './types';
import {
  addDays,
  addMonths,
  cycleKey,
  cycleRange,
  dateOnly,
  epoch,
  inRange,
  midnight,
  nextDueDate,
  validateRange,
} from './dates';
import { assertKobo, sumKobo } from './money';

export function transactionsInRange(state: FinanceState, range: DateRange): Transaction[] {
  validateRange(range);
  return state.transactions.filter((row) => !row.deletedAt && inRange(row.occurredAt, range));
}
export function categoryIds(state: FinanceState, categoryId: string): string[] {
  return [
    categoryId,
    ...state.categories.filter((row) => row.parentId === categoryId).map((row) => row.id),
  ];
}
export interface Summary {
  incomeKobo: number;
  expenseKobo: number;
  balanceKobo: number;
  count: number;
}
export function summarize(state: FinanceState, range: DateRange): Summary {
  const rows = transactionsInRange(state, range);
  const incomeKobo = sumKobo(
    rows.filter((row) => row.kind === 'income').map((row) => row.amountKobo),
  );
  const expenseKobo = sumKobo(
    rows.filter((row) => row.kind === 'expense').map((row) => row.amountKobo),
  );
  return {
    incomeKobo,
    expenseKobo,
    balanceKobo: sumKobo([incomeKobo, -expenseKobo]),
    count: rows.length,
  };
}
export interface CategoryTotal {
  categoryId: string;
  name: string;
  kind: EntryKind;
  amountKobo: number;
  percentOfIncome: number | null;
}
export function categoryBreakdown(state: FinanceState, range: DateRange): CategoryTotal[] {
  const rows = transactionsInRange(state, range);
  const income = summarize(state, range).incomeKobo;
  return state.categories
    .filter((row) => !row.parentId)
    .map((category) => {
      const ids = new Set(categoryIds(state, category.id));
      const amountKobo = sumKobo(
        rows.filter((row) => ids.has(row.categoryId)).map((row) => row.amountKobo),
      );
      return {
        categoryId: category.id,
        name: category.name,
        kind: category.kind,
        amountKobo,
        percentOfIncome: income === 0 ? null : (amountKobo / income) * 100,
      };
    });
}
export interface ChartPoint {
  key: string;
  incomeKobo: number;
  expenseKobo: number;
}
export function chartSeries(
  state: FinanceState,
  range: DateRange,
  granularity: 'hour' | 'day' | 'month',
): ChartPoint[] {
  validateRange(range);
  const bucketKey = (value: string): string => {
    const day = dateOnly(value);
    if (granularity === 'month') return day.slice(0, 7);
    if (granularity === 'day') return day;
    return `${day}T${String(new Date(epoch(value)).getHours()).padStart(2, '0')}:00`;
  };
  const buckets = new Map<string, ChartPoint>();
  let cursor = range.start;
  if (granularity === 'hour') {
    const date = new Date(epoch(cursor));
    date.setMinutes(0, 0, 0);
    cursor = date.toISOString();
  } else
    cursor = midnight(
      granularity === 'month' ? `${dateOnly(cursor).slice(0, 7)}-01` : dateOnly(cursor),
    );
  let count = 0;
  while (epoch(cursor) < epoch(range.end)) {
    if (++count > 100000) throw new Error('Chart range is too large.');
    const key = bucketKey(cursor);
    if (!buckets.has(key)) buckets.set(key, { key, incomeKobo: 0, expenseKobo: 0 });
    cursor =
      granularity === 'hour'
        ? new Date(epoch(cursor) + 3600000).toISOString()
        : midnight(
            granularity === 'month' ? addMonths(dateOnly(cursor), 1) : addDays(dateOnly(cursor), 1),
          );
  }
  for (const row of transactionsInRange(state, range)) {
    const bucket = buckets.get(bucketKey(row.occurredAt));
    if (bucket) {
      const field = row.kind === 'income' ? 'incomeKobo' : 'expenseKobo';
      bucket[field] = sumKobo([bucket[field], row.amountKobo]);
    }
  }
  return [...buckets.values()];
}
export interface RecurringOccurrence {
  ruleId: string;
  name: string;
  date: string;
  kind: EntryKind;
  amountKobo: number;
}
export interface RecurringSummary {
  incomeKobo: number;
  expenseKobo: number;
  netKobo: number;
  occurrences: RecurringOccurrence[];
}
export function recurringSummary(state: FinanceState, range: DateRange): RecurringSummary {
  validateRange(range);
  const occurrences: RecurringOccurrence[] = [];
  for (const rule of state.recurringRules.filter((row) => row.active)) {
    let date = rule.nextDueDate;
    let count = 0;
    while (epoch(date) < epoch(range.end)) {
      if (++count > 100000 || occurrences.length >= 100000)
        throw new Error('Recurring range is too large.');
      if (inRange(date, range))
        occurrences.push({
          ruleId: rule.id,
          name: rule.name,
          date,
          kind: rule.kind,
          amountKobo: rule.amountKobo,
        });
      date = nextDueDate(date, rule.frequency, rule.anchorDate ?? rule.nextDueDate);
    }
  }
  occurrences.sort((a, b) => a.date.localeCompare(b.date) || a.ruleId.localeCompare(b.ruleId));
  const incomeKobo = sumKobo(
    occurrences.filter((row) => row.kind === 'income').map((row) => row.amountKobo),
  );
  const expenseKobo = sumKobo(
    occurrences.filter((row) => row.kind === 'expense').map((row) => row.amountKobo),
  );
  return { incomeKobo, expenseKobo, netKobo: sumKobo([incomeKobo, -expenseKobo]), occurrences };
}
export interface BudgetProgress {
  id: string;
  categoryId: string;
  limitKobo: number;
  spentKobo: number;
  remainingKobo: number;
  percent: number;
}
export function budgetProgress(state: FinanceState, value: string): BudgetProgress[] {
  const range = cycleRange(value, state.settings.cycleStartDay);
  const key = cycleKey(value, state.settings.cycleStartDay);
  const rows = transactionsInRange(state, range).filter((row) => row.kind === 'expense');
  return state.budgets
    .filter((row) => row.cycleKey === key)
    .map((budget) => {
      const ids = new Set(categoryIds(state, budget.categoryId));
      const spentKobo = sumKobo(
        rows.filter((row) => ids.has(row.categoryId)).map((row) => row.amountKobo),
      );
      return {
        id: budget.id,
        categoryId: budget.categoryId,
        limitKobo: budget.limitKobo,
        spentKobo,
        remainingKobo: sumKobo([budget.limitKobo, -spentKobo]),
        percent: (spentKobo / budget.limitKobo) * 100,
      };
    });
}
const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
/** Exact normalized merchant/note history; frequency wins, recency breaks ties. */
export function suggestCategory(
  state: FinanceState,
  input: { note: string; merchant: string; kind: EntryKind },
): string | null {
  const note = normalize(input.note),
    merchant = normalize(input.merchant);
  if (!note && !merchant) return null;
  const active = new Set(state.categories.filter((row) => !row.archived).map((row) => row.id));
  const scores = new Map<string, { score: number; latest: number }>();
  for (const row of state.transactions) {
    if (row.deletedAt || row.kind !== input.kind || !active.has(row.categoryId)) continue;
    const score =
      (merchant && normalize(row.merchant) === merchant ? 2 : 0) +
      (note && normalize(row.note) === note ? 1 : 0);
    if (!score) continue;
    const previous = scores.get(row.categoryId) ?? { score: 0, latest: 0 };
    scores.set(row.categoryId, {
      score: previous.score + score,
      latest: Math.max(previous.latest, epoch(row.occurredAt)),
    });
  }
  return (
    [...scores.entries()].sort(
      (a, b) => b[1].score - a[1].score || b[1].latest - a[1].latest || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? null
  );
}
export interface PlannerWhatIf {
  additionalExpenseKobo?: number;
  additionalIncomeKobo?: number;
}
export interface Plan {
  range: DateRange;
  plannedIncomeKobo: number;
  spentKobo: number;
  remainingKobo: number;
  daysRemaining: number;
  dailyAvailableKobo: number;
  projectedExpenseKobo: number;
}
export function plan(state: FinanceState, value: string, whatIf: PlannerWhatIf = {}): Plan {
  const range = cycleRange(value, state.settings.cycleStartDay);
  const today = dateOnly(value);
  const summary = summarize(state, range);
  const additionalExpense = whatIf.additionalExpenseKobo ?? 0;
  const additionalIncome = whatIf.additionalIncomeKobo ?? 0;
  assertKobo(additionalExpense, 'What-if expense');
  assertKobo(additionalIncome, 'What-if income');
  const plannedIncomeKobo = sumKobo([
    state.settings.plannedIncomeKobo || summary.incomeKobo,
    additionalIncome,
  ]);
  // nextDueDate advances only on confirmation, so the full cycle also reserves overdue bills.
  const scheduled = recurringSummary(state, range);
  const projectedExpenseKobo = sumKobo([
    summary.expenseKobo,
    scheduled.expenseKobo,
    additionalExpense,
  ]);
  const remainingKobo = sumKobo([plannedIncomeKobo, -projectedExpenseKobo]);
  let daysRemaining = 0;
  for (let day = today; epoch(day) < epoch(range.end); day = addDays(day, 1)) daysRemaining++;
  return {
    range,
    plannedIncomeKobo,
    spentKobo: summary.expenseKobo,
    remainingKobo,
    daysRemaining,
    dailyAvailableKobo: Math.max(0, Math.floor(remainingKobo / Math.max(1, daysRemaining))),
    projectedExpenseKobo,
  };
}
