import { PlatformError } from './errors';
export interface DailyTime { hour: number; minute: number }
export function parseReminderTime(value: string): DailyTime {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new PlatformError('reminder-time', 'Use a valid reminder time in HH:MM format.');
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
}
export const REMINDER_IDS = ['pabloooo.morning', 'pabloooo.evening'] as const;
export const REMINDER_CHANNEL = 'pabloooo-daily';
