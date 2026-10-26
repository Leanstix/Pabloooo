import { describe, expect, it } from 'vitest';
import { validateFinanceState } from '../../src/domain/validation';
import { openRepository } from '../../src/platform/core/repository';
import { FakeDatabase } from './fakeDatabase';
import { fixtureState } from './fixtures';
describe('repository lifecycle', () => {
  it('requires successful load before initializing and persists all state', async () => {
    const database = new FakeDatabase();
    const repository = await openRepository(database, validateFinanceState);
    await expect(repository.save(fixtureState())).rejects.toThrow('Load local data successfully');
    expect(await repository.load()).toBeNull();
    await repository.save(fixtureState());
    expect(await repository.load()).toEqual(fixtureState());
    expect(database.pragmas[0]).toContain('journal_mode = WAL');
  });
  it('closes once after queued writes and rejects use after close', async () => {
    const database = new FakeDatabase();
    const repository = await openRepository(database, validateFinanceState);
    await repository.load();
    const saving = repository.save(fixtureState());
    const closing = repository.close();
    await saving; await closing; await repository.close();
    expect(database.row?.revision).toBe(0);
    expect(database.closed).toBe(1);
    await expect(repository.load()).rejects.toThrow('closed');
    await expect(repository.save(fixtureState(1))).rejects.toThrow('closed');
  });
});
