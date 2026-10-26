import { expect, it, vi } from 'vitest';
import { createShortcutService, type ShortcutPort } from '../../src/platform/core/shortcut';
import { pngHeader } from './fixtures';
function fixture() {
  const port: ShortcutPort = {
    available: vi.fn(async () => true), pickPng: vi.fn(async () => ({ uri: 'file:///gallery/chosen', mimeType: 'image/png' })),
    inspect: vi.fn(async () => ({ header: pngHeader(), size: 1000 })), persist: vi.fn(async () => 'file:///private/icon.png'),
    requestPin: vi.fn(async () => true), remove: vi.fn(async () => undefined),
  };
  return { port, create: createShortcutService(port) };
}
it('reports unsupported Expo Go or launcher without opening gallery', async () => {
  const { port, create } = fixture(); vi.mocked(port.available).mockResolvedValueOnce(false);
  expect(await create()).toMatchObject({ status: 'unsupported' }); expect(port.pickPng).not.toHaveBeenCalled();
});
it('treats gallery cancellation as cancellation without native work', async () => {
  const { port, create } = fixture(); vi.mocked(port.pickPng).mockResolvedValueOnce(null);
  expect(await create()).toMatchObject({ status: 'cancelled' }); expect(port.persist).not.toHaveBeenCalled();
});
it('persists a validated private icon and reports request, never confirmed pinning', async () => {
  const { port, create } = fixture();
  const result = await create();
  expect(result.status).toBe('requested'); expect(result.message).toContain('Confirm Add');
  expect(port.requestPin).toHaveBeenCalledWith('file:///private/icon.png');
  expect(vi.mocked(port.persist).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(port.requestPin).mock.invocationCallOrder[0] ?? 0);
  expect(port.remove).toHaveBeenCalledWith('file:///private/icon.png');
});
it('rejects invalid PNG before persistence and cleans a private copy after native errors', async () => {
  const { port, create } = fixture();
  vi.mocked(port.inspect).mockResolvedValueOnce({ header: new Uint8Array(32), size: 1000 });
  await expect(create()).rejects.toThrow('valid PNG'); expect(port.persist).not.toHaveBeenCalled();
  vi.mocked(port.requestPin).mockRejectedValueOnce(new Error('Launcher unavailable'));
  await expect(create()).rejects.toThrow('Launcher unavailable'); expect(port.remove).toHaveBeenCalledOnce();
});
