import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { PlatformError } from '../core/errors';
import { privateCacheDirectory, removePrivateFile } from './privateFiles';
let exportSequence = 0;
/** The caller must invoke this from an explicit Export action. No upload occurs here. */
export async function shareSpreadsheet(bytes: Uint8Array, filename: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync()))
    throw new PlatformError(
      'sharing-unavailable',
      'Android sharing is unavailable on this device.',
    );
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}\.xlsx$/.test(filename) || bytes.length === 0)
    throw new PlatformError('spreadsheet-file', 'The generated spreadsheet is invalid.');
  exportSequence += 1;
  const uri = `${privateCacheDirectory()}${Date.now()}-${exportSequence}-${filename}`;
  const file = new File(uri);
  try {
    await file.write(bytes);
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Save your Pabloooo spreadsheet',
    });
  } catch (error) {
    await removePrivateFile(uri);
    throw error;
  }
  // Keep successful handoffs in private cache for receivers to finish reading.
}
