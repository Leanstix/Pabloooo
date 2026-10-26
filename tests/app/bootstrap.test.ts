import { describe, expect, it, vi } from 'vitest';
import { FinanceEngine } from '../../src/app/engine';
import { fresh, memoryRepository } from './fixtures';

describe('safe application bootstrap', () => {
  it('creates an empty local ledger once on a genuinely new installation', async () => {
    const { repository, read } = memoryRepository();
    const engine = new FinanceEngine(repository, 'new-phone');
    await Promise.all([engine.initialize(), engine.initialize()]);
    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(read()?.transactions).toEqual([]);
    expect(engine.getSnapshot().ready).toBe(true);
  });
  it('loads existing data without rewriting it', async () => {
    const { repository } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'different-phone');
    await engine.initialize();
    expect(engine.getSnapshot().state.installationId).toBe('test-phone');
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('never overwrites records when storage cannot be read', async () => {
    const { repository } = memoryRepository();
    vi.mocked(repository.load).mockRejectedValue(new Error('Unreadable local data'));
    const engine = new FinanceEngine(repository, 'new-phone');
    await expect(engine.initialize()).rejects.toThrow('Unreadable');
    expect(repository.save).not.toHaveBeenCalled();
    expect(engine.getSnapshot()).toMatchObject({ ready: false, busy: false, error: 'Unreadable local data' });
  });
  it('supports retry after a temporary read failure', async () => {
    const { repository } = memoryRepository(fresh());
    vi.mocked(repository.load).mockRejectedValueOnce(new Error('Busy'));
    const engine = new FinanceEngine(repository, 'new-phone');
    await expect(engine.initialize()).rejects.toThrow();
    await engine.initialize();
    expect(engine.getSnapshot()).toMatchObject({ ready: true, error: null });
  });
  it('rejects an invalid loaded snapshot without replacing it', async () => {
    const { repository } = memoryRepository({ ...fresh(), revision: -1 });
    const engine = new FinanceEngine(repository, 'new-phone');
    await expect(engine.initialize()).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
