import { PlatformError } from './errors';
import { parseReminderTime, REMINDER_IDS, type DailyTime } from './reminderTime';
import { createSerialQueue } from './serial';
export interface ReminderRequest { identifier: string; title: string; body: string; time: DailyTime }
export interface ScheduledReminder { identifier: string; restore: unknown }
export interface NotificationPort {
  /** Creates the Android channel and checks/requests local notification permission. */
  prepare(): Promise<boolean>;
  list(): Promise<ScheduledReminder[]>;
  cancel(identifier: string): Promise<void>;
  schedule(request: ReminderRequest): Promise<void>;
  restore(request: ScheduledReminder): Promise<void>;
}
export interface ReminderTimes { morningTime: string; eveningTime: string }
export function createReminderService(port: NotificationPort) {
  const queue = createSerialQueue();
  return (enabled: boolean, times: ReminderTimes): Promise<void> => queue(async () => {
    const morning = parseReminderTime(times.morningTime);
    const evening = parseReminderTime(times.eveningTime);
    if (enabled && !(await port.prepare())) throw new PlatformError('notification-permission', 'Allow notifications in Android settings to enable daily reminders.');
    const previous = (await port.list()).filter(item => REMINDER_IDS.some(id => id === item.identifier));
    const requests: ReminderRequest[] = enabled ? [
      { identifier: REMINDER_IDS[0], title: 'A fresh start', body: 'Take a moment to plan today’s spending.', time: morning },
      { identifier: REMINDER_IDS[1], title: 'Your evening check-in', body: 'Log today’s income and expenses in Pabloooo.', time: evening },
    ] : [];
    try {
      for (const identifier of REMINDER_IDS) await port.cancel(identifier);
      for (const request of requests) await port.schedule(request);
    } catch (error) {
      let recovered = true;
      for (const identifier of REMINDER_IDS) {
        try { await port.cancel(identifier); } catch { recovered = false; }
      }
      for (const reminder of previous) {
        try { await port.restore(reminder); } catch { recovered = false; }
      }
      if (!recovered) throw new PlatformError('reminder-rollback', 'Android could not restore the previous reminders. Reminders may be incomplete; try configuring them again.');
      throw error;
    }
  });
}
