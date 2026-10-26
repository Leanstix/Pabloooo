import type { DateRange, Frequency } from './types';

const DAY = 86_400_000;
export function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
export function dateOnly(value: string): string {
  const date = value.slice(0, 10);
  if (!isDate(date)) throw new Error('Invalid calendar date.');
  return date;
}
export function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  if (!isDate(value.slice(0, 10))) return false;
  const hours = Number(value.slice(11, 13));
  const minutes = Number(value.slice(14, 16));
  const seconds = Number(value.slice(17, 19));
  const offset = /([+-])(\d{2}):(\d{2})$/.exec(value);
  return hours < 24 && minutes < 60 && seconds < 60 && (!offset || (Number(offset[2]) < 24 && Number(offset[3]) < 60)) && Number.isFinite(Date.parse(value));
}
export function isDateTime(value: unknown): value is string { return isDate(value) || isTimestamp(value); }
export function timestamp(now: Date | string = new Date()): string {
  const date = typeof now === 'string' ? new Date(now) : now;
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid current time.');
  return date.toISOString();
}
export function epoch(value: string): number {
  if (!isDateTime(value)) throw new Error('Invalid date or timestamp.');
  return Date.parse(isDate(value) ? `${value}T00:00:00.000Z` : value);
}
function ymd(year: number, month: number, day: number): string {
  if (year < 1 || year > 9999) throw new Error('Date is outside the supported calendar.');
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
export function addDays(date: string, count: number): string {
  if (!isDate(date) || !Number.isSafeInteger(count)) throw new Error('Invalid day arithmetic.');
  return dateOnly(new Date(epoch(date) + count * DAY).toISOString());
}
export function addMonths(date: string, count: number): string {
  if (!isDate(date) || !Number.isSafeInteger(count)) throw new Error('Invalid month arithmetic.');
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const index = year * 12 + month - 1 + count;
  const nextYear = Math.floor(index / 12);
  const nextMonth = ((index % 12) + 12) % 12 + 1;
  return ymd(nextYear, nextMonth, Math.min(day, daysInMonth(nextYear, nextMonth)));
}
export function nextDueDate(date: string, frequency: Frequency): string {
  if (frequency === 'daily') return addDays(date, 1);
  if (frequency === 'weekly') return addDays(date, 7);
  if (frequency === 'monthly') return addMonths(date, 1);
  if (frequency === 'yearly') return addMonths(date, 12);
  throw new Error('Unknown recurring frequency.');
}
export function validateRange(range: DateRange): DateRange {
  if (!isDateTime(range.start) || !isDateTime(range.end) || epoch(range.start) >= epoch(range.end)) throw new Error('Date range must have a valid start before its exclusive end.');
  return range;
}
export function inRange(value: string, range: DateRange): boolean {
  const time = epoch(value);
  return time >= epoch(range.start) && time < epoch(range.end);
}
export function cycleRange(value: string, startDay: number): DateRange {
  if (!Number.isInteger(startDay) || startDay < 1 || startDay > 31) throw new Error('Cycle start day must be between 1 and 31.');
  const date = dateOnly(value);
  const [year, month] = date.split('-').map(Number) as [number, number];
  const thisStart = ymd(year, month, Math.min(startDay, daysInMonth(year, month)));
  const anchor = date < thisStart ? addMonths(ymd(year, month, 1), -1) : ymd(year, month, 1);
  const [startYear, startMonth] = anchor.split('-').map(Number) as [number, number];
  const next = addMonths(anchor, 1);
  const [endYear, endMonth] = next.split('-').map(Number) as [number, number];
  return {
    start: ymd(startYear, startMonth, Math.min(startDay, daysInMonth(startYear, startMonth))),
    end: ymd(endYear, endMonth, Math.min(startDay, daysInMonth(endYear, endMonth))),
  };
}
export function cycleKey(value: string, startDay: number): string { return cycleRange(value, startDay).start; }
export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export function reportRange(period: ReportPeriod, value: string, custom?: DateRange): DateRange {
  const date = dateOnly(value);
  const [year, month] = date.split('-').map(Number) as [number, number];
  if (period === 'custom') {
    if (!custom) throw new Error('Custom report needs a date range.');
    return validateRange({ ...custom });
  }
  if (period === 'day') return { start: date, end: addDays(date, 1) };
  if (period === 'week') {
    const weekday = new Date(epoch(date)).getUTCDay();
    const start = addDays(date, -((weekday + 6) % 7));
    return { start, end: addDays(start, 7) };
  }
  if (period === 'month') return { start: ymd(year, month, 1), end: addMonths(ymd(year, month, 1), 1) };
  if (period === 'quarter') {
    const start = ymd(year, Math.floor((month - 1) / 3) * 3 + 1, 1);
    return { start, end: addMonths(start, 3) };
  }
  if (period === 'year') return { start: ymd(year, 1, 1), end: ymd(year + 1, 1, 1) };
  throw new Error('Unknown report period.');
}
/** Inclusive date-picker end becomes the domain's exclusive end. */
export function inclusiveRange(start: string, end: string): DateRange {
  if (!isDate(start) || !isDate(end)) throw new Error('Choose valid calendar dates.');
  return validateRange({ start, end: addDays(end, 1) });
}
