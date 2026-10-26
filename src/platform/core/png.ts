import { PlatformError } from './errors';
export const MAX_PNG_BYTES = 8 * 1024 * 1024;
export const MAX_PNG_DIMENSION = 4096;
export const MAX_PNG_PIXELS = 16 * 1024 * 1024;
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
export interface PngDimensions {
  width: number;
  height: number;
}
export function inspectPng(
  header: Uint8Array,
  byteLength: number,
  mimeType: string | null,
): PngDimensions {
  if (mimeType !== 'image/png')
    throw new PlatformError('shortcut-mime', 'Choose a PNG image from your gallery.');
  if (!Number.isSafeInteger(byteLength) || byteLength < 33 || byteLength > MAX_PNG_BYTES)
    throw new PlatformError('shortcut-size', 'Choose a PNG image smaller than 8 MB.');
  if (
    header.length < 24 ||
    SIGNATURE.some((value, index) => header[index] !== value) ||
    String.fromCharCode(...header.slice(12, 16)) !== 'IHDR'
  )
    throw new PlatformError('shortcut-signature', 'The selected file is not a valid PNG image.');
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (
    !width ||
    !height ||
    width > MAX_PNG_DIMENSION ||
    height > MAX_PNG_DIMENSION ||
    width * height > MAX_PNG_PIXELS
  )
    throw new PlatformError(
      'shortcut-dimensions',
      'Choose a PNG image no larger than 4096 × 4096 pixels.',
    );
  return { width, height };
}
