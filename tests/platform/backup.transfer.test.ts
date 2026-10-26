import { expect, it, vi } from 'vitest';
import { validateFinanceState } from '../../src/domain/validation';
import { serializeBackup } from '../../src/platform/core/backup';
import {
  createBackupTransfer,
  type BackupTransferPort,
} from '../../src/platform/core/backupTransfer';
import { MAX_BACKUP_BYTES } from '../../src/platform/core/integrity';
import { fixtureState } from './fixtures';
function setup() {
  const port: BackupTransferPort = {
    canShare: vi.fn(async () => true),
    writePrivate: vi.fn(async () => 'file:///cache/export.json'),
    share: vi.fn(async () => undefined),
    removePrivate: vi.fn(async () => undefined),
    pick: vi.fn(async () => ({ uri: 'file:///cache/import.json', size: 100 })),
    readPrivate: vi.fn(async () => serializeBackup(fixtureState(), validateFinanceState)),
  };
  return { port, service: createBackupTransfer(port, validateFinanceState) };
}
it('waits for explicit export and keeps shared bytes available to Android recipients', async () => {
  const { port, service } = setup();
  expect(port.writePrivate).not.toHaveBeenCalled();
  await service.exportBackup(fixtureState());
  expect(port.share).toHaveBeenCalledWith('file:///cache/export.json');
  expect(port.removePrivate).not.toHaveBeenCalled();
});
it('checks sharing availability before writing and cleans up failed shares', async () => {
  const { port, service } = setup();
  vi.mocked(port.canShare).mockResolvedValueOnce(false);
  await expect(service.exportBackup(fixtureState())).rejects.toThrow('unavailable');
  expect(port.writePrivate).not.toHaveBeenCalled();
  vi.mocked(port.share).mockRejectedValueOnce(new Error('Share failed'));
  await expect(service.exportBackup(fixtureState())).rejects.toThrow('Share failed');
  expect(port.removePrivate).toHaveBeenCalledWith('file:///cache/export.json');
});
it('returns null on cancellation and never attempts a read', async () => {
  const { port, service } = setup();
  vi.mocked(port.pick).mockResolvedValueOnce(null);
  expect(await service.pickBackup()).toBeNull();
  expect(port.readPrivate).not.toHaveBeenCalled();
});
it('rejects oversized imports before reading and removes picked temporary copies', async () => {
  const { port, service } = setup();
  vi.mocked(port.pick).mockResolvedValueOnce({
    uri: 'file:///cache/import.json',
    size: MAX_BACKUP_BYTES + 1,
  });
  await expect(service.pickBackup()).rejects.toThrow('smaller than');
  expect(port.readPrivate).not.toHaveBeenCalled();
  expect(port.removePrivate).toHaveBeenCalledOnce();
});
it('validates an import without replacing state and cleans up malformed selections', async () => {
  const { port, service } = setup();
  expect(await service.pickBackup()).toEqual(fixtureState());
  vi.mocked(port.readPrivate).mockResolvedValueOnce('broken');
  await expect(service.pickBackup()).rejects.toThrow('valid JSON');
  expect(port.removePrivate).toHaveBeenCalledTimes(2);
});
