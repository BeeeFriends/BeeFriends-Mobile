import type { NotificationItemDto } from "@beefriends/shared-kernel/dto/notification";

import { requestJson } from "@/api/client";

import { NOTIFICATIONS_BASE } from "./constants";

export async function getNotifications(userId: number) {
  return requestJson<NotificationItemDto[]>(
    `${NOTIFICATIONS_BASE}?userId=${userId}`,
  );
}
