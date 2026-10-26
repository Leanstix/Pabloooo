import { describe, expect, it } from 'vitest';
import { FinanceEngine } from '../../src/app/engine';
import { entry, fresh, memoryRepository } from './fixtures';

describe('backup restore integration', () => {
  it('advances the local revision and disables imported notification intent', async () => {
    const { repository, read } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'phone');
    await engine.initialize();
    await engine.dispatch({ type: 'transaction.save', value: entry('local') });
    const backup = fresh();
    backup.revision = 100;
    backup.settings.remindersEnabled = true;
    await engine.restore(backup);
    expect(read()?.revision).toBe(2);
    expect(read()?.settings.remindersEnabled).toBe(false);
    expect(read()?.transactions).toEqual([]);
  });
  it('keeps current records when a restore fails deep validation', async () => {
    const { repository } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'phone');
    await engine.initialize();
    await engine.dispatch({ type: 'transaction.save', value: entry('local') });
    const invalid = { ...fresh(), settings: { ...fresh().settings, currency: 'USD' } };
    await expect(engine.restore(invalid)).rejects.toThrow();
    expect(engine.getSnapshot().state.transactions[0]?.id).toBe('local');
  });
});
