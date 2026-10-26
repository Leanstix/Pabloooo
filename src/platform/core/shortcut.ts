import { inspectPng } from './png';
export interface ShortcutResult {
  status: 'requested' | 'unsupported' | 'cancelled';
  message: string;
}
export interface ShortcutPort {
  available(): Promise<boolean>;
  pickPng(): Promise<{ uri: string; mimeType: string | null } | null>;
  inspect(uri: string): Promise<{ header: Uint8Array; size: number }>;
  persist(uri: string): Promise<string>;
  requestPin(uri: string): Promise<boolean>;
  remove(uri: string): Promise<void>;
}
export function createShortcutService(port: ShortcutPort): () => Promise<ShortcutResult> {
  return async () => {
    if (!(await port.available()))
      return {
        status: 'unsupported',
        message:
          'Home screen shortcuts need an installed Android build and a launcher that supports pinned shortcuts. Expo Go cannot create them.',
      };
    const picked = await port.pickPng();
    if (!picked) return { status: 'cancelled', message: 'No image selected.' };
    const image = await port.inspect(picked.uri);
    inspectPng(image.header, image.size, picked.mimeType);
    const localUri = await port.persist(picked.uri);
    try {
      const requested = await port.requestPin(localUri);
      return requested
        ? {
            status: 'requested',
            message:
              'Shortcut request sent. Confirm Add on your Android launcher to place it on your home screen.',
          }
        : {
            status: 'unsupported',
            message: 'Your launcher could not accept the shortcut request.',
          };
    } finally {
      await port.remove(localUri);
    }
  };
}
