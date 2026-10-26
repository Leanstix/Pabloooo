export interface LocalNotificationPermission {
  granted: boolean;
  canAskAgain: boolean;
}
export interface NotificationPermissionPort {
  /** Null represents Android versions without notification channels. */
  createChannel(): Promise<{ importance: number } | null>;
  currentPermission(): Promise<LocalNotificationPermission>;
  requestPermission(): Promise<LocalNotificationPermission>;
}
/** Android preserves user-disabled channel settings when a channel is re-created. */
export function createNotificationPermissionPreparer(port: NotificationPermissionPort) {
  return async (): Promise<boolean> => {
    const channel = await port.createChannel();
    if (channel?.importance === 0) return false;
    let permission = await port.currentPermission();
    if (!permission.granted && permission.canAskAgain) permission = await port.requestPermission();
    return permission.granted;
  };
}
