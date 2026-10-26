import { describe, expect, it } from 'vitest';
import { compactNaira, intervalLabel, selectedInterval } from '../../src/ui/chart';

const points = [
  { key: '2026-10-26T08:00', incomeKobo: 100000, expenseKobo: 0 },
  { key: '2026-10-26T09:00', incomeKobo: 0, expenseKobo: 25000 },
  { key: '2026-10-26T10:00', incomeKobo: 0, expenseKobo: 0 },
];

describe('interactive chart intervals', () => {
  it('starts at the latest interval with activity instead of trailing empty time', () => {
    expect(selectedInterval(points, null)).toBe(1);
    expect(
      selectedInterval(
        points.map((point) => ({ ...point, incomeKobo: 0, expenseKobo: 0 })),
        null,
      ),
    ).toBe(0);
  });
  it('preserves explicit selection even when the interval is empty', () => {
    expect(selectedInterval(points, '2026-10-26T10:00')).toBe(2);
  });
  it('recovers safely when changing report ranges', () => {
    expect(selectedInterval(points, '2025-01')).toBe(1);
    expect(selectedInterval([], '2026-10-26T09:00')).toBe(-1);
  });
  it('labels hourly buckets with the local calendar day and hour', () => {
    const label = intervalLabel('2026-10-26T08:00');
    expect(label).toContain('26');
    expect(label).toContain('Oct');
    expect(label).toContain('2026');
    expect(label).toContain('08:00');
  });
  it('distinguishes monthly buckets from daily buckets', () => {
    expect(intervalLabel('2026-10')).toBe('Oct 2026');
    expect(intervalLabel('2026-10-26')).toContain('26');
    expect(intervalLabel('invalid')).toBe('invalid');
  });
  it('keeps naira axis ticks short without confusing kobo and naira', () => {
    expect(compactNaira(50)).toBe('₦0.5');
    expect(compactNaira(100)).toBe('₦1');
    expect(compactNaira(125000)).toBe('₦1.3k');
    expect(compactNaira(200000000)).toBe('₦2M');
    expect(compactNaira(300000000000)).toBe('₦3B');
  });
});
