import type { NotificationSettingsDto } from "@beefriends/shared-kernel/dto/notification";

import { requestJson } from "@/api/client";

import { NOTIFICATIONS_BASE } from "./constants";

export async function getNotificationSettings(userId: number) {
  return requestJson<NotificationSettingsDto>(
    `${NOTIFICATIONS_BASE}/settings/${userId}`,
  );
}
