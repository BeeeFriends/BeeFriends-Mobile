import { MATCH_ENDPOINTS } from "@beefriends/shared-kernel";
import type { MatchDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export function getUserMatches(userId: number) {
  return requestJson<MatchDto[]>(MATCH_ENDPOINTS.BY_USER(userId));
}
