import { beforeEach, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ write: vi.fn(), share: vi.fn(), remove: vi.fn(), available: vi.fn() }));
vi.mock('expo-file-system', () => ({ File: class { write(bytes: Uint8Array) { return native.write(bytes); } } }));
vi.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file:///cache/', documentDirectory: 'file:///files/', getInfoAsync: async () => ({ exists: false }), deleteAsync: native.remove }));
vi.mock('expo-sharing', () => ({ shareAsync: native.share, isAvailableAsync: native.available }));
import { shareSpreadsheet } from '../../src/platform/adapters/spreadsheet';
beforeEach(() => { native.write.mockResolvedValue(undefined); native.share.mockResolvedValue(undefined); native.available.mockResolvedValue(true); native.remove.mockResolvedValue(undefined); });
it('waits for Expo 58 asynchronous binary write before handing a file to Android', async () => {
  let finish: () => void = () => undefined;
  native.write.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  const sharing = shareSpreadsheet(Uint8Array.from([80, 75, 3, 4]), 'Pabloooo.xlsx');
  await Promise.resolve(); await Promise.resolve();
  expect(native.share).not.toHaveBeenCalled();
  finish(); await sharing;
  expect(native.share).toHaveBeenCalledOnce(); expect(native.remove).not.toHaveBeenCalled();
});
it('does not share a partially written spreadsheet and cleans failed output', async () => {
  native.write.mockRejectedValueOnce(new Error('Disk is full'));
  await expect(shareSpreadsheet(Uint8Array.from([80, 75]), 'Pabloooo.xlsx')).rejects.toThrow('Disk is full');
  expect(native.share).not.toHaveBeenCalled(); expect(native.remove).toHaveBeenCalledOnce();
});
it('rejects unsafe filenames and empty spreadsheet bytes before a write', async () => {
  await expect(shareSpreadsheet(Uint8Array.from([1]), '../outside.xlsx')).rejects.toThrow('invalid');
  await expect(shareSpreadsheet(new Uint8Array(), 'Pabloooo.xlsx')).rejects.toThrow('invalid');
  expect(native.write).not.toHaveBeenCalled();
});
