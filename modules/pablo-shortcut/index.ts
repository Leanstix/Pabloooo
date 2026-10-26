import { requireOptionalNativeModule } from 'expo-modules-core';
export interface PabloShortcutNative {
  isAvailable(): Promise<boolean>;
  requestPinShortcut(localFileUri: string): Promise<boolean>;
}
/** Optional lookup keeps Expo Go usable and reports its lack of native support. */
export const PabloShortcut = requireOptionalNativeModule<PabloShortcutNative>('PabloShortcut');
