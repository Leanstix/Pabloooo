import { expect, it } from 'vitest';
import { migrateDatabase } from '../../src/platform/core/migration';
import { FakeDatabase } from './fakeDatabase';
it('refuses a future schema without changing its version or stored data', async () => {
  const database = new FakeDatabase(); database.version = 9;
  await expect(migrateDatabase(database)).rejects.toThrow('newer version');
  expect(database.version).toBe(9); expect(database.row).toBeNull();
});
it('keeps schema at version zero when table creation fails', async () => {
  const database = new FakeDatabase(); database.failMigration = true;
  await expect(migrateDatabase(database)).rejects.toThrow('Disk is full');
  expect(database.version).toBe(0);
  database.failMigration = false; await migrateDatabase(database); await migrateDatabase(database);
  expect(database.version).toBe(1);
});
