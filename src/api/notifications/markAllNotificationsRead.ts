import type { NotificationItemDto } from "@beefriends/shared-kernel/dto/notification";

import { requestJson } from "@/api/client";

import { NOTIFICATIONS_BASE } from "./constants";

export async function markAllNotificationsRead(userId: number) {
  return requestJson<NotificationItemDto[]>(`${NOTIFICATIONS_BASE}/read-all`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}
