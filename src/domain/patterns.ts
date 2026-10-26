import type { DateRange, FinanceState } from './types';
import { categoryIds, transactionsInRange } from './analytics';
import { dateOnly, validateRange } from './dates';
import { assertKobo } from './money';

export interface CategoryFrequency {
  count: number;
  activeDays: number;
  /** Mean amount per actual transaction, rounded to the nearest kobo (halves up). */
  averageKobo: number;
  /** Mean calendar-day gap between distinct local activity dates. */
  averageGapDays: number | null;
  recurringCount: number;
}

/** Actual recorded activity only; recurring templates never create extra occurrences. */
export function categoryFrequency(state: FinanceState, categoryId: string, range: DateRange): CategoryFrequency {
  validateRange(range);
  const category = state.categories.find(row => row.id === categoryId);
  if (!category) throw new Error('Category does not exist.');
  const ids = new Set(categoryIds(state, categoryId));
  const entries = transactionsInRange(state, range).filter(row => row.kind === category.kind && ids.has(row.categoryId));
  const days = [...new Set(entries.map(row => dateOnly(row.occurredAt)))].sort();
  let total = 0n;
  for (const entry of entries) {
    assertKobo(entry.amountKobo, 'Transaction amount', false);
    total += BigInt(entry.amountKobo);
  }
  const count = entries.length;
  const divisor = BigInt(count);
  // BigInt avoids losing the final kobo when a safe amount is close to MAX_SAFE_INTEGER.
  const averageKobo = count ? Number((total + divisor / 2n) / divisor) : 0;
  const utcDay = (day: string): number => Date.parse(`${day}T00:00:00.000Z`) / 86_400_000;
  let gapDays = 0;
  for (let index = 1; index < days.length; index++) gapDays += utcDay(days[index]!) - utcDay(days[index - 1]!);
  return {
    count, activeDays: days.length, averageKobo,
    averageGapDays: days.length > 1 ? gapDays / (days.length - 1) : null,
    recurringCount: entries.filter(row => row.recurringId !== null).length,
  };
}
