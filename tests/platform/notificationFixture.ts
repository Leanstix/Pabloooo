import { vi } from 'vitest';
import type {
  NotificationPort,
  ReminderRequest,
  ScheduledReminder,
} from '../../src/platform/core/notifications';
export function notificationFixture() {
  const scheduled = new Map<string, unknown>([
    ['pabloooo.morning', { old: 'morning' }],
    ['pabloooo.evening', { old: 'evening' }],
    ['other.app', { untouched: true }],
  ]);
  const events: string[] = [];
  const port: NotificationPort = {
    prepare: vi.fn(async () => {
      events.push('permission');
      return true;
    }),
    list: vi.fn(async () => {
      events.push('list');
      return [...scheduled].map(([identifier, restore]) => ({ identifier, restore }));
    }),
    cancel: vi.fn(async (identifier) => {
      events.push(`cancel:${identifier}`);
      scheduled.delete(identifier);
    }),
    schedule: vi.fn(async (request: ReminderRequest) => {
      events.push(`schedule:${request.identifier}`);
      scheduled.set(request.identifier, request);
    }),
    restore: vi.fn(async (request: ScheduledReminder) => {
      events.push(`restore:${request.identifier}`);
      scheduled.set(request.identifier, request.restore);
    }),
  };
  return { port, scheduled, events };
}
export const reminderTimes = { morningTime: '08:00', eveningTime: '20:00' };
