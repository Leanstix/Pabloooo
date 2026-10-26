import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createReminderService } from '../core/notifications';
import { REMINDER_CHANNEL } from '../core/reminderTime';
import { createNotificationPermissionPreparer } from '../core/notificationPermission';
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});
const prepare = createNotificationPermissionPreparer({
  createChannel: () => Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, { name: 'Daily money check-ins', importance: Notifications.AndroidImportance.DEFAULT, sound: 'default', enableVibrate: true }),
  currentPermission: () => Notifications.getPermissionsAsync(),
  requestPermission: () => Notifications.requestPermissionsAsync(),
});
const service = createReminderService({
  prepare: async () => Platform.OS === 'android' && await prepare(),
  async list() {
    return (await Notifications.getAllScheduledNotificationsAsync()).map(item => ({ identifier: item.identifier, restore: item }));
  },
  cancel: identifier => Notifications.cancelScheduledNotificationAsync(identifier),
  async schedule(request) {
    await Notifications.scheduleNotificationAsync({ identifier: request.identifier, content: { title: request.title, body: request.body, sound: 'default' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: request.time.hour, minute: request.time.minute, channelId: REMINDER_CHANNEL } });
  },
  async restore(previous) {
    const item = previous.restore as Notifications.NotificationRequest;
    await Notifications.scheduleNotificationAsync({ identifier: item.identifier, content: { title: item.content.title ?? undefined, body: item.content.body ?? undefined, sound: 'default' }, trigger: item.trigger as Notifications.NotificationTriggerInput });
  },
});
/** Resolves only when Android has accepted both schedules (or both cancellations). */
export const configureReminders = service;
