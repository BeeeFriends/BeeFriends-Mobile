import { Platform } from "react-native";
import type {
  NotificationItemDto,
  NotificationSettingsDto,
  UpdateNotificationSettingsPayload,
} from "@beefriends/shared-kernel/dto/notification";
import { requestJson } from "./client";

const BASE = "/v1/notifications";

export async function getNotifications(userId: number) {
  return requestJson<NotificationItemDto[]>(`${BASE}?userId=${userId}`);
}

export async function getNotificationSettings(userId: number) {
  return requestJson<NotificationSettingsDto>(`${BASE}/settings/${userId}`);
}

export async function updateNotificationSettings(
  userId: number,
  payload: UpdateNotificationSettingsPayload,
) {
  return requestJson<NotificationSettingsDto>(`${BASE}/settings/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function registerDeviceToken(userId: number, token: string) {
  return requestJson(`${BASE}/device-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    }),
  });
}

export async function markNotificationRead(id: string, userId: number) {
  return requestJson<NotificationItemDto>(`${BASE}/${id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function markAllNotificationsRead(userId: number) {
  return requestJson<NotificationItemDto[]>(`${BASE}/read-all`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}
