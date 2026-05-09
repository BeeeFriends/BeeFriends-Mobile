import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import {
  registerDeviceToken,
  updateDeviceTokenState,
} from "../api/notifications";

const PUSH_TOKEN_KEY = "beefriends.push.deviceToken";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
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
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    await updateDeviceTokenState(
      userId,
      token,
      AppState.currentState !== "active",
    ).catch(() => undefined);
    return token;
  } catch {
    return null;
  }
}

export async function syncPushDeliveryState(userId: number, shouldReceivePush: boolean) {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;

  await updateDeviceTokenState(userId, token, shouldReceivePush);
}
