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
