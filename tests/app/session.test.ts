import { describe, expect, it, vi } from 'vitest';
import { createSessionManager } from '../../src/app/session';
import { FinanceEngine } from '../../src/app/engine';
import { fresh, memoryRepository } from './fixtures';

describe('React native application session lifecycle', () => {
  it('does not open storage for an effect cancelled before acquisition starts', async () => {
    const manager = createSessionManager();
    const factory = vi.fn(async () => new FinanceEngine(memoryRepository().repository, 'phone'));
    const session = manager.open(factory);
    session.cancel();
    expect(await session.ready).toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });
  it('closes a cancelled acquisition before a replacement session initializes', async () => {
    const manager = createSessionManager();
    const first = memoryRepository();
    const second = memoryRepository(fresh());
    let release!: () => void;
    const acquired = new Promise<void>(resolve => { release = resolve; });
    const a = manager.open(async () => {
      await acquired;
      return new FinanceEngine(first.repository, 'old-phone');
    });
    await Promise.resolve();
    a.cancel();
    const b = manager.open(async () => {
      expect(first.repository.close).toHaveBeenCalledTimes(1);
      return new FinanceEngine(second.repository, 'new-phone');
    });
    release();
    expect(await a.ready).toBeNull();
    expect(first.repository.load).not.toHaveBeenCalled();
    expect((await b.ready)?.getSnapshot().ready).toBe(true);
    b.cancel();
  });
  it('lets initialization finish before closing and reopening the database', async () => {
    const manager = createSessionManager();
    const first = memoryRepository();
    let release!: () => void;
    vi.mocked(first.repository.load).mockImplementationOnce(() => new Promise(resolve => { release = () => resolve(null); }));
    const a = manager.open(async () => new FinanceEngine(first.repository, 'phone'));
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    a.cancel();
    const b = manager.open(async () => {
      expect(first.repository.save).toHaveBeenCalledTimes(1);
      expect(first.repository.close).toHaveBeenCalledTimes(1);
      return new FinanceEngine(memoryRepository(fresh()).repository, 'new-phone');
    });
    release();
    expect(await a.ready).toBeNull();
    expect(await b.ready).not.toBeNull();
    b.cancel();
  });
  it('recovers the lifecycle queue after an initialization error', async () => {
    const manager = createSessionManager();
    const first = memoryRepository();
    vi.mocked(first.repository.load).mockRejectedValueOnce(new Error('Read failed'));
    const a = manager.open(async () => new FinanceEngine(first.repository, 'phone'));
    await expect(a.ready).rejects.toThrow('Read failed');
    const b = manager.open(async () => new FinanceEngine(memoryRepository().repository, 'next-phone'));
    expect((await b.ready)?.getSnapshot().ready).toBe(true);
    b.cancel();
  });
});
