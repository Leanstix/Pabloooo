import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { validateFinanceState } from '../../domain/validation';
import { createBackupTransfer } from '../core/backupTransfer';
import { PlatformError } from '../core/errors';
import { MAX_BACKUP_BYTES } from '../core/integrity';
import { assertPrivateUri, privateCacheDirectory, privateFilename, removePrivateFile } from './privateFiles';
const backupTransfer = createBackupTransfer({
  canShare: () => Sharing.isAvailableAsync(),
  async writePrivate(text) {
    const uri = `${privateCacheDirectory()}${privateFilename('Pabloooo-backup', 'json')}`;
    await FileSystem.writeAsStringAsync(uri, text, { encoding: FileSystem.EncodingType.UTF8 });
    return uri;
  },
  share: uri => Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Save your Pabloooo backup', UTI: 'public.json' }),
  removePrivate: removePrivateFile,
  async pick() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', 'application/octet-stream'], copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) throw new PlatformError('backup-selection', 'No backup file was selected.');
    assertPrivateUri(asset.uri);
    return { uri: asset.uri, size: asset.size };
  },
  async readPrivate(uri) {
    assertPrivateUri(uri);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory || info.size > MAX_BACKUP_BYTES) throw new PlatformError('backup-size', 'Choose a readable JSON backup smaller than 16 MB.');
    return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  },
}, validateFinanceState);
export const exportBackup = backupTransfer.exportBackup;
export const pickBackup = backupTransfer.pickBackup;
