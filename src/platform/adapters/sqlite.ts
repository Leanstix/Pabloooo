import * as SQLite from 'expo-sqlite';
import { validateFinanceState } from '../../domain/validation';
import { openRepository } from '../core/repository';
import type { StateRepository } from '../core/ports';
/** Never reset or replace a database after initialization or load failure. */
export async function createRepository(): Promise<StateRepository> {
  const database = await SQLite.openDatabaseAsync('pabloooo-local.db');
  try {
    return await openRepository(database, validateFinanceState);
  } catch (error) {
    await database.closeAsync().catch(() => undefined);
    throw error;
  }
}
