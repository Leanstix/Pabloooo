import { chartSeries, inclusiveRange, isDate, reportRange, summarize } from '../domain';
import type { ChartPoint, DateRange, FinanceState, ReportPeriod, Summary } from '../domain';

export interface ReportInputs { period: ReportPeriod; anchor: string; start: string; end: string }
export type ReportView =
  | { ok: true; range: DateRange; totals: Summary; points: ChartPoint[] }
  | { ok: false; error: string };

/** Date fields are incomplete while typing; never let their domain errors escape render. */
export function prepareReport(state: FinanceState, inputs: ReportInputs): ReportView {
  const { period, anchor, start, end } = inputs;
  if (period === 'custom') {
    if (!isDate(start) || !isDate(end)) return { ok: false, error: 'Enter valid start and end dates using YYYY-MM-DD.' };
    if (start > end) return { ok: false, error: 'The end date must be on or after the start date.' };
  } else if (!isDate(anchor)) {
    return { ok: false, error: 'Enter a valid date using YYYY-MM-DD.' };
  }
  try {
    const range = period === 'custom' ? inclusiveRange(start, end) : reportRange(period, anchor);
    const first = new Date(range.start);
    const last = new Date(new Date(range.end).getTime() - 1);
    const months = (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth() + 1;
    // Bound the visible chart before constructing its buckets or SVG hit targets.
    if (months > 1200) return { ok: false, error: 'Choose a shorter range of up to 100 years to display this chart.' };
    const days = (new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000;
    const granularity = period === 'day' ? 'hour' : period === 'year' || period === 'quarter' || days > 95 ? 'month' : 'day';
    return { ok: true, range, totals: summarize(state, range), points: chartSeries(state, range, granularity) };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : '';
    return {
      ok: false,
      error: /calendar|date|timestamp|range/i.test(message)
        ? 'That period extends beyond the supported calendar. Choose another date or a shorter range.'
        : 'This report could not be calculated. Try a shorter date range.',
    };
  }
}
