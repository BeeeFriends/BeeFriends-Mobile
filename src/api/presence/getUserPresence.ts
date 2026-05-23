import { PRESENCE_ENDPOINTS } from "@beefriends/shared-kernel";
import type { PresenceDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export function getUserPresence(userId: number) {
  return requestJson<PresenceDto>(PRESENCE_ENDPOINTS.BY_USER(userId));
}
