import { describe, expect, it } from 'vitest';
import { isDate, isTimestamp, addDays, addMonths, nextDueDate, cycleRange, cycleKey, reportRange, inclusiveRange, inRange } from '../../src/domain/dates';

describe('calendar arithmetic', () => {
  it('validates actual leap days rather than JavaScript date rollover', () => {
    expect(isDate('2024-02-29')).toBe(true);
    expect(isDate('2025-02-29')).toBe(false);
    expect(isDate('2100-02-29')).toBe(false);
    expect(isDate('2000-02-29')).toBe(true);
    expect(isDate('2026-04-31')).toBe(false);
  });
});

it('accepts explicit timestamp offsets and rejects invalid hours minutes seconds and dates', () => {
  expect(isTimestamp('2026-10-26T23:59:59.999+01:00')).toBe(true);
  for (const value of ['2026-02-30T12:00:00Z', '2026-10-26T24:00:00Z', '2026-10-26T12:60:00Z', '2026-10-26T12:00:60Z', '2026-10-26T12:00:00', '2026-10-26T12:00:00+25:00']) expect(isTimestamp(value), value).toBe(false);
});

it('advances daily weekly monthly and yearly dates across actual month lengths', () => {
  expect(nextDueDate('2026-12-31', 'daily')).toBe('2027-01-01');
  expect(nextDueDate('2026-12-28', 'weekly')).toBe('2027-01-04');
  expect(nextDueDate('2026-01-31', 'monthly')).toBe('2026-02-28');
  expect(nextDueDate('2024-02-29', 'yearly')).toBe('2025-02-28');
  expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
});

it('returns to the original day after short months and leap years', () => {
  let date = nextDueDate('2026-01-31', 'monthly', '2026-01-31');
  expect(date).toBe('2026-02-28');
  date = nextDueDate(date, 'monthly', '2026-01-31');
  expect(date).toBe('2026-03-31');
  let leap = '2024-02-29';
  for (let year = 2025; year <= 2028; year++) leap = nextDueDate(leap, 'yearly', '2024-02-29');
  expect(leap).toBe('2028-02-29');
});

it('uses the actual clamped start date as the budget cycle key', () => {
  expect(cycleKey('2026-02-27', 31)).toBe('2026-01-31');
  expect(cycleKey('2026-02-28', 31)).toBe('2026-02-28');
  expect(cycleKey('2026-03-30', 31)).toBe('2026-02-28');
  expect(cycleKey('2026-03-31', 31)).toBe('2026-03-31');
  expect(cycleRange('2026-02-28', 31)).toEqual({ start: new Date(2026, 1, 28).toISOString(), end: new Date(2026, 2, 31).toISOString() });
});

it('rejects invalid cycle starts and dates before generating a range', () => {
  for (const day of [0, 32, -1, 1.5, NaN]) expect(() => cycleRange('2026-10-26', day)).toThrow();
  expect(() => cycleRange('2026-02-30', 1)).toThrow();
  expect(cycleKey('2026-01-01', 15)).toBe('2025-12-15');
});

it('creates Monday weeks and complete month quarter and year ranges', () => {
  const iso = (y: number, m: number, d: number) => new Date(y, m - 1, d).toISOString();
  expect(reportRange('week', '2026-11-01')).toEqual({ start: iso(2026, 10, 26), end: iso(2026, 11, 2) });
  expect(reportRange('month', '2024-02-29')).toEqual({ start: iso(2024, 2, 1), end: iso(2024, 3, 1) });
  expect(reportRange('quarter', '2026-12-15')).toEqual({ start: iso(2026, 10, 1), end: iso(2027, 1, 1) });
  expect(reportRange('year', '2026-10-26')).toEqual({ start: iso(2026, 1, 1), end: iso(2027, 1, 1) });
});

it('includes the entire selected last day without including the next midnight', () => {
  const range = inclusiveRange('2026-10-01', '2026-10-26');
  expect(inRange(new Date(2026, 9, 26, 23, 59, 59, 999).toISOString(), range)).toBe(true);
  expect(inRange(new Date(2026, 9, 27).toISOString(), range)).toBe(false);
  expect(() => inclusiveRange('2026-10-27', '2026-10-26')).toThrow();
  expect(() => reportRange('custom', '2026-10-26')).toThrow();
});
