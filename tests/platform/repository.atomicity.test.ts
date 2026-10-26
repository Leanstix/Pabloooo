import { expect, it } from 'vitest';
import { validateFinanceState } from '../../src/domain/validation';
import { openRepository } from '../../src/platform/core/repository';
import { FakeDatabase } from './fakeDatabase';
import { fixtureState } from './fixtures';
it('rolls back a failed SQLite mutation and permits retry of the same revision', async () => {
  const database = new FakeDatabase();
  const repository = await openRepository(database, validateFinanceState);
  await repository.load(); await repository.save(fixtureState());
  const before = { ...database.row };
  database.failMutation = true;
  await expect(repository.save(fixtureState(1))).rejects.toThrow('Disk is full');
  expect(database.row).toEqual(before);
  await repository.save(fixtureState(1));
  expect((await repository.load())?.revision).toBe(1);
});
it('captures each queued snapshot before a caller can mutate its state', async () => {
  const database = new FakeDatabase();
  const repository = await openRepository(database, validateFinanceState);
  await repository.load(); await repository.save(fixtureState());
  const next = fixtureState(1);
  const first = repository.save(next);
  next.settings.plannedIncomeKobo = 42;
  await first;
  expect((await repository.load())?.settings.plannedIncomeKobo).toBe(0);
});
