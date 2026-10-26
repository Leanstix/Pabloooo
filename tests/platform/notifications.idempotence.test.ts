import { expect, it } from 'vitest';
import { createReminderService } from '../../src/platform/core/notifications';
import { notificationFixture, reminderTimes } from './notificationFixture';
it('keeps exactly two stable reminders on repeated enable with configurable local times', async () => {
  const { port, scheduled } = notificationFixture(); const configure = createReminderService(port);
  await configure(true, reminderTimes);
  await configure(true, { morningTime: '07:10', eveningTime: '21:45' });
  expect([...scheduled.keys()].sort()).toEqual(['other.app', 'pabloooo.evening', 'pabloooo.morning']);
  expect(scheduled.get('pabloooo.morning')).toMatchObject({ time: { hour: 7, minute: 10 } });
  expect(scheduled.get('pabloooo.evening')).toMatchObject({ time: { hour: 21, minute: 45 } });
});
it('disables only its stable IDs without prompting for permission', async () => {
  const { port, scheduled } = notificationFixture(); const configure = createReminderService(port);
  await configure(false, reminderTimes); await configure(false, reminderTimes);
  expect([...scheduled.keys()]).toEqual(['other.app']); expect(port.prepare).not.toHaveBeenCalled();
});
