import { expect, it, vi } from 'vitest';
import { createReminderService } from '../../src/platform/core/notifications';
import { notificationFixture, reminderTimes } from './notificationFixture';
it('preserves existing reminders when permission is denied before cancellation', async () => {
  const { port, scheduled, events } = notificationFixture();
  const before = new Map(scheduled);
  vi.mocked(port.prepare).mockResolvedValueOnce(false);
  await expect(createReminderService(port)(true, reminderTimes)).rejects.toThrow(
    'Allow notifications',
  );
  expect(scheduled).toEqual(before);
  expect(port.cancel).not.toHaveBeenCalled();
  expect(events).toEqual([]);
});
it('finishes permission preparation before querying and canceling schedules', async () => {
  const { port, events } = notificationFixture();
  await createReminderService(port)(true, reminderTimes);
  expect(events.slice(0, 3)).toEqual(['permission', 'list', 'cancel:pabloooo.morning']);
});
it('rejects malformed times before requesting permission or touching Android', async () => {
  const { port } = notificationFixture();
  await expect(
    createReminderService(port)(true, { ...reminderTimes, morningTime: '25:00' }),
  ).rejects.toThrow('HH:MM');
  expect(port.prepare).not.toHaveBeenCalled();
  expect(port.cancel).not.toHaveBeenCalled();
});
