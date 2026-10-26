import { afterEach, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initialState, reduceFinance, validateFinanceState } from '../../src/domain';
import { openRepository } from '../../src/platform/core/repository';
import type { SqlDatabase, SqlTransaction, SqlValue } from '../../src/platform/core/ports';

/** Execute production SQL against a real SQLite engine, independent of Android bridge mocks. */
class SqliteAdapter implements SqlDatabase {
  constructor(readonly database: DatabaseSync) {}
  async getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null> {
    return (this.database.prepare(sql).get(...params) as T | undefined) ?? null;
  }
  async runAsync(sql: string, ...params: SqlValue[]) {
    return { changes: Number(this.database.prepare(sql).run(...params).changes) };
  }
  async execAsync(sql: string) {
    this.database.exec(sql);
  }
  async withExclusiveTransactionAsync(task: (transaction: SqlTransaction) => Promise<void>) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      await task(this);
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
  async closeAsync() {
    this.database.close();
  }
}
const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
function location() {
  const directory = mkdtempSync(join(tmpdir(), 'pabloooo-sqlite-'));
  directories.push(directory);
  return join(directory, 'journal.db');
}
const seed = () => initialState('real-sqlite', '2026-10-26T00:00:00.000Z');

it('migrates production tables and reads records after a real SQLite file reopen', async () => {
  const path = location();
  const first = await openRepository(
    new SqliteAdapter(new DatabaseSync(path)),
    validateFinanceState,
  );
  expect(await first.load()).toBeNull();
  await first.save(seed());
  await first.close();
  const second = await openRepository(
    new SqliteAdapter(new DatabaseSync(path)),
    validateFinanceState,
  );
  expect((await second.load())?.categories).toHaveLength(seed().categories.length);
  await second.close();
});

it('enforces compare-and-swap across real independent SQLite connections', async () => {
  const path = location();
  const first = await openRepository(
    new SqliteAdapter(new DatabaseSync(path)),
    validateFinanceState,
  );
  await first.load();
  await first.save(seed());
  const second = await openRepository(
    new SqliteAdapter(new DatabaseSync(path)),
    validateFinanceState,
  );
  const old = (await second.load())!;
  await first.save(reduceFinance(old, { type: 'settings.update', value: { cycleStartDay: 25 } }));
  await expect(
    second.save(reduceFinance(old, { type: 'settings.update', value: { theme: 'dark' } })),
  ).rejects.toThrow('another session');
  const current = (await second.load())!;
  await second.save(reduceFinance(current, { type: 'settings.update', value: { theme: 'dark' } }));
  expect((await first.load())?.settings).toMatchObject({ cycleStartDay: 25, theme: 'dark' });
  await first.close();
  await second.close();
});

it('rolls back real SQL failures and permits retry without advancing the revision', async () => {
  const database = new DatabaseSync(location());
  const repository = await openRepository(new SqliteAdapter(database), validateFinanceState);
  await repository.load();
  await repository.save(seed());
  database.exec(
    "CREATE TRIGGER deny_snapshot_update BEFORE UPDATE ON finance_snapshot BEGIN SELECT RAISE(ABORT, 'write blocked'); END;",
  );
  const next = reduceFinance(seed(), { type: 'settings.update', value: { cycleStartDay: 25 } });
  await expect(repository.save(next)).rejects.toThrow('write blocked');
  expect((await repository.load())?.revision).toBe(0);
  database.exec('DROP TRIGGER deny_snapshot_update');
  await repository.save(next);
  expect((await repository.load())?.settings.cycleStartDay).toBe(25);
  await repository.close();
});
