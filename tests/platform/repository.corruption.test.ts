import { expect, it } from 'vitest';
import { validateFinanceState } from '../../src/domain/validation';
import { openRepository } from '../../src/platform/core/repository';
import { encodeSnapshot } from '../../src/platform/core/snapshot';
import { FakeDatabase } from './fakeDatabase';
import { fixtureState } from './fixtures';
it('never overwrites data after a failed load, including after a later good read', async () => {
  const database = new FakeDatabase();
  database.row = encodeSnapshot(fixtureState(), validateFinanceState);
  const original = { ...database.row };
  database.row.payload += ' ';
  const corrupted = { ...database.row };
  const repository = await openRepository(database, validateFinanceState);
  await expect(repository.load()).rejects.toThrow('integrity');
  await expect(repository.save(fixtureState(1))).rejects.toThrow('Load local data successfully');
  expect(database.row).toEqual(corrupted);
  database.row = original;
  await repository.load();
  await expect(repository.save(fixtureState(1))).rejects.toThrow('Load local data successfully');
});
it('rejects matching-checksum snapshots with inconsistent row revisions', async () => {
  const database = new FakeDatabase();
  database.row = { ...encodeSnapshot(fixtureState(), validateFinanceState), revision: 7 };
  const repository = await openRepository(database, validateFinanceState);
  await expect(repository.load()).rejects.toThrow('revision');
});
