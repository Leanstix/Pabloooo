import type { FinanceState } from '../../domain/types';
import { PlatformError } from './errors';
import { MAX_BACKUP_BYTES } from './integrity';
import { parseBackup, serializeBackup } from './backup';
import type { StateValidator } from './ports';
export interface BackupTransferPort {
  canShare(): Promise<boolean>;
  writePrivate(text: string): Promise<string>;
  share(uri: string): Promise<void>;
  removePrivate(uri: string): Promise<void>;
  pick(): Promise<{ uri: string; size?: number } | null>;
  readPrivate(uri: string): Promise<string>;
}
export function createBackupTransfer(port: BackupTransferPort, validate: StateValidator) {
  return {
    async exportBackup(state: FinanceState): Promise<void> {
      const text = serializeBackup(state, validate);
      if (!(await port.canShare()))
        throw new PlatformError(
          'sharing-unavailable',
          'Android sharing is unavailable on this device.',
        );
      const uri = await port.writePrivate(text);
      // Android receivers may read the content URI after the chooser closes.
      // Keep successful exports in OS-managed private cache until Android reclaims them.
      try {
        await port.share(uri);
      } catch (error) {
        await port.removePrivate(uri);
        throw error;
      }
    },
    async pickBackup(): Promise<FinanceState | null> {
      const file = await port.pick();
      if (!file) return null;
      if (
        file.size !== undefined &&
        (!Number.isFinite(file.size) || file.size < 0 || file.size > MAX_BACKUP_BYTES)
      ) {
        await port.removePrivate(file.uri);
        throw new PlatformError('backup-too-large', 'Choose a Pabloooo backup smaller than 16 MB.');
      }
      try {
        return parseBackup(await port.readPrivate(file.uri), validate);
      } finally {
        await port.removePrivate(file.uri);
      }
    },
  };
}
