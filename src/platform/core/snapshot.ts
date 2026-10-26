import type { FinanceState } from '../../domain/types';
import { PlatformError } from './errors';
import { checksum, MAX_BACKUP_BYTES, utf8ByteLength } from './integrity';
import type { StateValidator } from './ports';
export interface SnapshotRow {
  schema_version: number;
  revision: number;
  payload: string;
  checksum: string;
}
export function encodeSnapshot(state: FinanceState, validate: StateValidator): SnapshotRow {
  const checked = validate(state);
  const payload = JSON.stringify(checked);
  if (utf8ByteLength(payload) > MAX_BACKUP_BYTES) {
    throw new PlatformError('too-large', 'Your data exceeds the local snapshot size limit.');
  }
  return { schema_version: 1, revision: checked.revision, payload, checksum: checksum(payload) };
}
export function decodeSnapshot(row: SnapshotRow, validate: StateValidator): FinanceState {
  if (
    row.schema_version !== 1 ||
    utf8ByteLength(row.payload) > MAX_BACKUP_BYTES ||
    checksum(row.payload) !== row.checksum
  ) {
    throw new PlatformError(
      'database-corrupt',
      'Local data failed its integrity check. It has not been overwritten.',
    );
  }
  const state = validate(JSON.parse(row.payload));
  if (state.revision !== row.revision) {
    throw new PlatformError(
      'database-corrupt',
      'Local data has an inconsistent revision. It has not been overwritten.',
    );
  }
  return state;
}
