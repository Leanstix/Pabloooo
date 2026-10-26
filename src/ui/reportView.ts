import { chartSeries, inclusiveRange, isDate, reportRange, summarize, type FinanceState, type ReportPeriod } from '../domain';

/** User-entered ranges stay inline validation errors, including supported-calendar edges. */
export function reportView(state: FinanceState, period: ReportPeriod, anchor: string, start: string, end: string) {
  try {
    if (period !== 'custom' && !isDate(anchor)) throw new Error('Use a valid date in YYYY-MM-DD format.');
    const range = reportRange(period, anchor, period === 'custom' ? inclusiveRange(start, end) : undefined);
    const granularity = period === 'day' ? 'hour' : period === 'year' || period === 'quarter' || Date.parse(range.end) - Date.parse(range.start) > 95 * 86400000 ? 'month' : 'day';
    return { ok: true as const, range, totals: summarize(state, range), points: chartSeries(state, range, granularity) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Choose a valid, shorter reporting period.' };
  }
}
