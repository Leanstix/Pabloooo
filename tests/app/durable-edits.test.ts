import { describe, expect, it, vi } from 'vitest';
import { FinanceEngine } from '../../src/app/engine';
import { entry, fresh, memoryRepository } from './fixtures';

describe('durable finance edits', () => {
  it('serializes simultaneous saves without dropping either entry', async () => {
    const { repository, read } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'phone');
    await engine.initialize();
    await Promise.all(
      ['lunch', 'dinner'].map((id) =>
        engine.dispatch({ type: 'transaction.save', value: entry(id) }),
      ),
    );
    expect(engine.getSnapshot().state.transactions).toHaveLength(2);
    expect(read()?.revision).toBe(2);
  });
  it('publishes an entry only after the database confirms its write', async () => {
    const { repository } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'phone');
    await engine.initialize();
    let complete!: () => void;
    vi.mocked(repository.save).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const save = engine.dispatch({ type: 'transaction.save', value: entry('lunch') });
    await vi.waitFor(() => expect(complete).toBeTypeOf('function'));
    expect(engine.getSnapshot().state.transactions).toEqual([]);
    expect(engine.getSnapshot().busy).toBe(true);
    complete();
    await save;
    expect(engine.getSnapshot().state.transactions).toHaveLength(1);
  });
  it('retains the last durable state on failure and accepts the next valid edit', async () => {
    const { repository } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'phone');
    await engine.initialize();
    vi.mocked(repository.save).mockRejectedValueOnce(new Error('Storage full'));
    await expect(
      engine.dispatch({ type: 'transaction.save', value: entry('failed') }),
    ).rejects.toThrow('Storage full');
    expect(engine.getSnapshot().state.transactions).toEqual([]);
    await engine.dispatch({ type: 'transaction.save', value: entry('success') });
    expect(engine.getSnapshot().state.transactions.map((item) => item.id)).toEqual(['success']);
    expect(engine.getSnapshot().busy).toBe(false);
  });
  it('rejects invalid amounts without calling persistence', async () => {
    const { repository } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'phone');
    await engine.initialize();
    await expect(
      engine.dispatch({ type: 'transaction.save', value: entry('bad', -1) }),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('notifies subscribers and allows unsubscribing', async () => {
    const { repository } = memoryRepository(fresh());
    const engine = new FinanceEngine(repository, 'phone');
    const listener = vi.fn();
    const off = engine.subscribe(listener);
    await engine.initialize();
    expect(listener).toHaveBeenCalled();
    off();
    listener.mockClear();
    engine.dismissError();
    expect(listener).not.toHaveBeenCalled();
  });
});
