import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { PabloShortcut } from '../../../modules/pablo-shortcut';
import { decodeBase64 } from '../core/base64';
import { PlatformError } from '../core/errors';
import { MAX_PNG_BYTES } from '../core/png';
import { createShortcutService } from '../core/shortcut';
import { privateDocumentDirectory, privateFilename, removePrivateFile } from './privateFiles';
export const createPngShortcut = createShortcutService({
  available: async () => Platform.OS === 'android' && !!PabloShortcut && await PabloShortcut.isAvailable(),
  async pickPng() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: false });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) throw new PlatformError('shortcut-selection', 'No image was selected.');
    return { uri: asset.uri, mimeType: asset.mimeType ?? null };
  },
  async inspect(uri) {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory || info.size > MAX_PNG_BYTES) throw new PlatformError('shortcut-size', 'Choose a readable PNG image smaller than 8 MB.');
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64, position: 0, length: 32 });
    return { header: decodeBase64(base64), size: info.size };
  },
  async persist(uri) {
    const target = `${privateDocumentDirectory()}${privateFilename('shortcut-icon', 'png')}`;
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  },
  requestPin: async uri => !!PabloShortcut && await PabloShortcut.requestPinShortcut(uri),
  remove: removePrivateFile,
});
