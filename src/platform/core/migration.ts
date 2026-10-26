import { PlatformError } from './errors';
import type { SqlDatabase } from './ports';
export const DATABASE_VERSION = 1;
export async function migrateDatabase(database: SqlDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const version = await transaction.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    if (!version || version.user_version > DATABASE_VERSION) {
      throw new PlatformError(
        'database-version',
        'This database needs a newer version of Pabloooo.',
      );
    }
    if (version.user_version === 0) {
      await transaction.execAsync(`CREATE TABLE IF NOT EXISTS finance_snapshot (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL CHECK (schema_version = 1),
        revision INTEGER NOT NULL CHECK (revision >= 0),
        payload TEXT NOT NULL,
        checksum TEXT NOT NULL
      ); PRAGMA user_version = 1;`);
    }
  });
}
