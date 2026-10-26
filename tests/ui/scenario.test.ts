import { expect, it } from 'vitest';
import { spendingScenario } from '../../src/ui/scenario';
it('calculates typed scenario inputs without changing ledger records', () => {
  expect(spendingScenario(100000, 10, '250.50', '100')).toEqual({ ok: true, total: '₦1,350.50', daily: '₦135.05' });
});
it('accepts blank optional inputs but reports malformed or negative amounts', () => {
  expect(spendingScenario(100000, 10, '', '').ok).toBe(true);
  expect(spendingScenario(100000, 10, 'bad', '').ok).toBe(false);
  expect(spendingScenario(100000, 10, '-1', '').ok).toBe(false);
});
it('reports aggregate overflow without throwing during render', () => {
  expect(spendingScenario(Number.MAX_SAFE_INTEGER, 10, '0.01', '').ok).toBe(false);
});
