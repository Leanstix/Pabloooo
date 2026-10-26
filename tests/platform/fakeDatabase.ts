import type { SqlDatabase, SqlTransaction, SqlValue } from '../../src/platform/core/ports';
import type { SnapshotRow } from '../../src/platform/core/snapshot';
export class FakeDatabase implements SqlDatabase {
  row: SnapshotRow | null = null;
  version = 0;
  closed = 0;
  pragmas: string[] = [];
  transactions = 0;
  failMutation = false;
  failMigration = false;
  async execAsync(sql: string): Promise<void> {
    if (sql.includes('journal_mode')) this.pragmas.push(sql);
    if (sql.includes('CREATE TABLE')) {
      if (this.failMigration) throw new Error('Disk is full');
      this.version = 1;
    }
  }
  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (sql.includes('user_version')) return { user_version: this.version } as T;
    return this.row ? (JSON.parse(JSON.stringify(this.row)) as T) : null;
  }
  async runAsync(sql: string, ...values: SqlValue[]): Promise<{ changes: number }> {
    if (sql.startsWith('UPDATE') && this.row?.revision !== values[4]) return { changes: 0 };
    const [schema, revision, payload, integrity] = values;
    this.row = {
      schema_version: Number(schema),
      revision: Number(revision),
      payload: String(payload),
      checksum: String(integrity),
    };
    if (this.failMutation) {
      this.failMutation = false;
      throw new Error('Disk is full');
    }
    return { changes: 1 };
  }
  async withExclusiveTransactionAsync(
    task: (transaction: SqlTransaction) => Promise<void>,
  ): Promise<void> {
    this.transactions += 1;
    const previous = this.row ? { ...this.row } : null;
    const version = this.version;
    try {
      await task(this);
    } catch (error) {
      this.row = previous;
      this.version = version;
      throw error;
    }
  }
  async closeAsync(): Promise<void> {
    this.closed += 1;
  }
}
