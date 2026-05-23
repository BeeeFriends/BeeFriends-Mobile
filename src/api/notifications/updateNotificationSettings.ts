import type {
  NotificationSettingsDto,
  UpdateNotificationSettingsPayload,
} from "@beefriends/shared-kernel/dto/notification";

import { requestJson } from "@/api/client";

import { NOTIFICATIONS_BASE } from "./constants";

export async function updateNotificationSettings(
  userId: number,
  payload: UpdateNotificationSettingsPayload,
) {
  return requestJson<NotificationSettingsDto>(
    `${NOTIFICATIONS_BASE}/settings/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
