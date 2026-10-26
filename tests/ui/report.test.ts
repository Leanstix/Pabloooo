import { describe, expect, it } from 'vitest';
import { initialState } from '../../src/domain';
import { prepareReport } from '../../src/ui/report';
import type { ReportInputs } from '../../src/ui/report';

const state = initialState('report-test', '2026-10-26T12:00:00.000Z');
const normal: ReportInputs = { period: 'month', anchor: '2026-10-26', start: '2026-10-01', end: '2026-10-26' };

describe('safe report view preparation', () => {
  it.each(['day', 'week', 'month', 'quarter', 'year'] as const)('keeps the %s view recoverable at the calendar upper boundary', period => {
    const result = prepareReport(state, { ...normal, period, anchor: '9999-12-31' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/calendar/);
  });
  it('rejects unsupported custom end boundaries without constructing chart buckets', () => {
    const result = prepareReport(state, { ...normal, period: 'custom', start: '0001-01-01', end: '9999-12-31' });
    expect(result.ok).toBe(false);
  });
  it('bounds enormous valid custom ranges before chart generation', () => {
    const result = prepareReport(state, { ...normal, period: 'custom', start: '0001-01-01', end: '9998-12-31' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/shorter range/);
  });
  it.each(['', '2026-', '2026-02-30', '0000-01-01', '10000-01-01'])('treats incomplete or invalid field %s as inline validation', anchor => {
    expect(prepareReport(state, { ...normal, anchor }).ok).toBe(false);
  });
  it('rejects reversed ranges', () => {
    const result = prepareReport(state, { ...normal, period: 'custom', start: '2026-11-01', end: '2026-10-01' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/on or after/);
  });
  it('recovers immediately after correcting a field', () => {
    expect(prepareReport(state, { ...normal, anchor: '9999-12-31' }).ok).toBe(false);
    const result = prepareReport(state, normal);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.points).toHaveLength(31);
      expect(result.totals.count).toBe(0);
    }
  });
  it('includes the selected end day and accepts leap-day ranges', () => {
    const result = prepareReport(state, { ...normal, period: 'custom', start: '2024-02-28', end: '2024-02-29' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points.map(point => point.key)).toEqual(['2024-02-28', '2024-02-29']);
  });
});
