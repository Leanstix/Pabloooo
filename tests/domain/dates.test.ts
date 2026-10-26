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
