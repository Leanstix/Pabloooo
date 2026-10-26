import { expect, it } from 'vitest';
import { validateFinanceState } from '../../src/domain/validation';
import { openRepository } from '../../src/platform/core/repository';
import { FakeDatabase } from './fakeDatabase';
import { fixtureState } from './fixtures';
it('rejects stale writers across repository handles until they reload', async () => {
  const database = new FakeDatabase();
  const first = await openRepository(database, validateFinanceState);
  await first.load();
  await first.save(fixtureState());
  const second = await openRepository(database, validateFinanceState);
  await second.load();
  await first.save(fixtureState(1));
  await expect(second.save(fixtureState(1))).rejects.toThrow('another session');
  expect(database.row?.revision).toBe(1);
  await second.load();
  await second.save(fixtureState(2));
  await expect(second.save(fixtureState(2))).rejects.toThrow('older');
  expect(database.row?.revision).toBe(2);
});
it('serializes overlapping save calls and recovers the queue after rejection', async () => {
  const repository = await openRepository(new FakeDatabase(), validateFinanceState);
  await repository.load();
  await repository.save(fixtureState());
  await Promise.all([repository.save(fixtureState(1)), repository.save(fixtureState(2))]);
  await expect(repository.save(fixtureState(1))).rejects.toThrow('older');
  await repository.save(fixtureState(3));
  expect((await repository.load())?.revision).toBe(3);
});
