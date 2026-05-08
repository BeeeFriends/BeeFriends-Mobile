import { PRESENCE_ENDPOINTS } from "@beefriends/shared-kernel";
import type { PresenceDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "./client";

export function getUserPresence(userId: number) {
  return requestJson<PresenceDto>(PRESENCE_ENDPOINTS.BY_USER(userId));
}

export function getBatchPresence(userIds: number[]) {
  return requestJson<PresenceDto[]>(PRESENCE_ENDPOINTS.BATCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds }),
  });
}
