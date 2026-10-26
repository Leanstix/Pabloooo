import * as FileSystem from 'expo-file-system/legacy';
import { PlatformError } from '../core/errors';
export function privateCacheDirectory(): string {
  if (!FileSystem.cacheDirectory) throw new PlatformError('files-unavailable', 'Private file storage is unavailable.');
  return FileSystem.cacheDirectory;
}
export function privateDocumentDirectory(): string {
  if (!FileSystem.documentDirectory) throw new PlatformError('files-unavailable', 'Private file storage is unavailable.');
  return FileSystem.documentDirectory;
}
let sequence = 0;
export function privateFilename(prefix: string, extension: 'json' | 'png'): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}.${extension}`;
}
export function assertPrivateUri(uri: string): void {
  const roots = [FileSystem.cacheDirectory, FileSystem.documentDirectory].filter((root): root is string => !!root);
  if (!uri.startsWith('file://') || !roots.some(root => uri.startsWith(root)) || uri.includes('/../') || uri.includes('/./')) {
    throw new PlatformError('unsafe-file', 'The selected file could not be copied into private storage.');
  }
}
export async function removePrivateFile(uri: string): Promise<void> {
  assertPrivateUri(uri);
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
