import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerDeviceToken } from "../api/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId: number) {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "BeeFriends",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const currentPermission = await Notifications.getPermissionsAsync();
    const finalPermission =
      currentPermission.status === "granted"
        ? currentPermission
        : await Notifications.requestPermissionsAsync();

    if (finalPermission.status !== "granted") return null;

    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token = String(deviceToken.data);
    await registerDeviceToken(userId, token);
    return token;
  } catch {
    return null;
  }
}
