import { expect, it, vi } from 'vitest';
import { createNotificationPermissionPreparer } from '../../src/platform/core/notificationPermission';
it('checks channel configuration before requesting Android 13 notification permission', async () => {
  const events: string[] = [];
  const prepare = createNotificationPermissionPreparer({
    createChannel: async () => {
      events.push('channel');
      return { importance: 3 };
    },
    currentPermission: async () => {
      events.push('current');
      return { granted: false, canAskAgain: true };
    },
    requestPermission: async () => {
      events.push('request');
      return { granted: true, canAskAgain: true };
    },
  });
  expect(await prepare()).toBe(true);
  expect(events).toEqual(['channel', 'current', 'request']);
});
it('refuses a user-disabled channel without prompting or canceling existing schedules', async () => {
  const currentPermission = vi.fn(async () => ({ granted: true, canAskAgain: true }));
  const requestPermission = vi.fn(async () => ({ granted: true, canAskAgain: true }));
  expect(
    await createNotificationPermissionPreparer({
      createChannel: async () => ({ importance: 0 }),
      currentPermission,
      requestPermission,
    })(),
  ).toBe(false);
  expect(currentPermission).not.toHaveBeenCalled();
  expect(requestPermission).not.toHaveBeenCalled();
});
it('avoids re-prompting a permanent denial and supports pre-channel Android versions', async () => {
  const requestPermission = vi.fn(async () => ({ granted: true, canAskAgain: true }));
  const prepare = createNotificationPermissionPreparer({
    createChannel: async () => null,
    currentPermission: async () => ({ granted: false, canAskAgain: false }),
    requestPermission,
  });
  expect(await prepare()).toBe(false);
  expect(requestPermission).not.toHaveBeenCalled();
});
