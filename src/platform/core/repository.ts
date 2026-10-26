import type { FinanceState } from '../../domain/types';
import { PlatformError } from './errors';
import { migrateDatabase } from './migration';
import type { SqlDatabase, StateRepository, StateValidator } from './ports';
import { createSerialQueue } from './serial';
import { decodeSnapshot, encodeSnapshot, type SnapshotRow } from './snapshot';

/** A failed load permanently locks this handle against writes. Reopen after recovery. */
export async function openRepository(
  database: SqlDatabase,
  validate: StateValidator,
): Promise<StateRepository> {
  await migrateDatabase(database);
  const queue = createSerialQueue();
  let loaded = false;
  let failedLoad = false;
  let closed = false;
  let expectedRevision: number | null = null;
  const assertOpen = () => {
    if (closed) throw new PlatformError('database-closed', 'The local database is closed.');
  };
  return {
    load: () =>
      queue(async () => {
        assertOpen();
        try {
          const row = await database.getFirstAsync<SnapshotRow>(
            'SELECT schema_version, revision, payload, checksum FROM finance_snapshot WHERE id = 1',
          );
          const state = row ? decodeSnapshot(row, validate) : null;
          expectedRevision = state?.revision ?? null;
          loaded = true;
          return state;
        } catch (error) {
          failedLoad = true;
          throw error;
        }
      }),
    save: async (state: FinanceState) => {
      // Capture the state before it joins the queue; callers cannot mutate queued data.
      const row = encodeSnapshot(state, validate);
      return queue(async () => {
        assertOpen();
        if (!loaded || failedLoad)
          throw new PlatformError('unsafe-save', 'Load local data successfully before saving.');
        if (expectedRevision !== null && row.revision <= expectedRevision) {
          throw new PlatformError(
            'stale-state',
            'This change is older than the saved data. Reload and try again.',
          );
        }
        await database.withExclusiveTransactionAsync(async (transaction) => {
          const existing = await transaction.getFirstAsync<{ revision: number }>(
            'SELECT revision FROM finance_snapshot WHERE id = 1',
          );
          if ((existing?.revision ?? null) !== expectedRevision) {
            throw new PlatformError(
              'concurrent-write',
              'Local data changed in another session. Reload before saving.',
            );
          }
          if (existing) {
            const result = await transaction.runAsync(
              'UPDATE finance_snapshot SET schema_version = ?, revision = ?, payload = ?, checksum = ? WHERE id = 1 AND revision = ?',
              row.schema_version,
              row.revision,
              row.payload,
              row.checksum,
              expectedRevision,
            );
            if (result.changes !== 1)
              throw new PlatformError(
                'concurrent-write',
                'The local save conflicted. Reload before saving.',
              );
          } else {
            await transaction.runAsync(
              'INSERT INTO finance_snapshot (id, schema_version, revision, payload, checksum) VALUES (1, ?, ?, ?, ?)',
              row.schema_version,
              row.revision,
              row.payload,
              row.checksum,
            );
          }
        });
        expectedRevision = row.revision;
      });
    },
    close: () =>
      queue(async () => {
        if (!closed) {
          await database.closeAsync();
          closed = true;
        }
      }),
  };
}
