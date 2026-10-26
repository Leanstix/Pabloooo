/** Detect accidental truncation or modification; this is not encryption or authentication. */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export const MAX_BACKUP_BYTES = 16 * 1024 * 1024;
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
