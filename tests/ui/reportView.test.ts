import { expect, it } from 'vitest';
import { initialState } from '../../src/domain';
import { reportView } from '../../src/ui/reportView';
const state = initialState('test');
it('keeps unsupported year boundaries as inline validation', () => {
  expect(reportView(state, 'year', '9999-12-31', '', '').ok).toBe(false);
});
it('keeps oversized custom charts from crashing the screen', () => {
  expect(reportView(state, 'custom', '2026-10-26', '0001-01-01', '9999-12-30').ok).toBe(false);
});
it('reports invalid or reversed date input and resumes on valid dates', () => {
  expect(reportView(state, 'month', 'broken', '', '').ok).toBe(false);
  expect(reportView(state, 'custom', '2026-10-26', '2026-10-26', '2026-10-01').ok).toBe(false);
  expect(reportView(state, 'month', '2026-10-26', '', '').ok).toBe(true);
});
