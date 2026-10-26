import { expect, it, vi } from 'vitest';
import { createReminderService } from '../../src/platform/core/notifications';
import { notificationFixture, reminderTimes } from './notificationFixture';
it('removes partially installed reminders and restores both old schedules on failure', async () => {
  const { port, scheduled } = notificationFixture(); const before = new Map(scheduled);
  vi.mocked(port.schedule).mockImplementationOnce(async request => { scheduled.set(request.identifier, request); }).mockRejectedValueOnce(new Error('Android scheduler failed'));
  await expect(createReminderService(port)(true, reminderTimes)).rejects.toThrow('Android scheduler failed');
  expect(scheduled).toEqual(before); expect(port.restore).toHaveBeenCalledTimes(2);
});
it('reports uncertain reminder state when rollback also fails', async () => {
  const { port } = notificationFixture();
  vi.mocked(port.schedule).mockRejectedValueOnce(new Error('Schedule failed'));
  vi.mocked(port.restore).mockRejectedValueOnce(new Error('Restore failed'));
  await expect(createReminderService(port)(true, reminderTimes)).rejects.toThrow('may be incomplete');
});
it('recovers the serial queue after a scheduling failure', async () => {
  const { port, scheduled } = notificationFixture();
  const configure = createReminderService(port);
  vi.mocked(port.schedule).mockRejectedValueOnce(new Error('One-time failure'));
  await expect(configure(true, reminderTimes)).rejects.toThrow('One-time failure');
  await configure(true, reminderTimes);
  expect(scheduled.size).toBe(3);
});
