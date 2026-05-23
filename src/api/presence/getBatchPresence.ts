import { PRESENCE_ENDPOINTS } from "@beefriends/shared-kernel";
import type { PresenceDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export function getBatchPresence(userIds: number[]) {
  return requestJson<PresenceDto[]>(PRESENCE_ENDPOINTS.BATCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds }),
  });
}
