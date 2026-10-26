import type { FinanceState } from '../../domain/types';
import { PlatformError } from './errors';
import { checksum, MAX_BACKUP_BYTES, utf8ByteLength } from './integrity';
import type { StateValidator } from './ports';
export interface BackupEnvelope {
  format: 'pabloooo.local-backup';
  version: 1;
  createdAt: string;
  checksum: string;
  data: FinanceState;
}
export function serializeBackup(
  state: FinanceState,
  validate: StateValidator,
  now = new Date(),
): string {
  const data = validate(state);
  const payload = JSON.stringify(data);
  const envelope: BackupEnvelope = {
    format: 'pabloooo.local-backup',
    version: 1,
    createdAt: now.toISOString(),
    checksum: checksum(payload),
    data,
  };
  const text = JSON.stringify(envelope, null, 2);
  if (utf8ByteLength(text) > MAX_BACKUP_BYTES)
    throw new PlatformError('backup-too-large', 'The backup exceeds the 16 MB import limit.');
  return text;
}
export function parseBackup(text: string, validate: StateValidator): FinanceState {
  if (utf8ByteLength(text) > MAX_BACKUP_BYTES)
    throw new PlatformError('backup-too-large', 'Choose a Pabloooo backup smaller than 16 MB.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new PlatformError('backup-json', 'The selected file is not valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new PlatformError('backup-format', 'Choose a Pabloooo JSON backup.');
  const envelope = value as Partial<BackupEnvelope>;
  if (
    envelope.format !== 'pabloooo.local-backup' ||
    envelope.version !== 1 ||
    typeof envelope.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(envelope.createdAt)) ||
    typeof envelope.checksum !== 'string' ||
    !envelope.data
  ) {
    throw new PlatformError('backup-version', 'This file is not a supported Pabloooo backup.');
  }
  if (checksum(JSON.stringify(envelope.data)) !== envelope.checksum)
    throw new PlatformError(
      'backup-integrity',
      'This backup is incomplete or has changed. Existing data has not been replaced.',
    );
  return validate(envelope.data);
}
