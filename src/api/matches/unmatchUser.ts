import { MATCH_ENDPOINTS } from "@beefriends/shared-kernel";
import type { MatchDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export function unmatchUser(matchId: string, userId: number) {
  const query = new URLSearchParams({
    userId: String(userId),
  });

  return requestJson<MatchDto>(
    `${MATCH_ENDPOINTS.UNMATCH(matchId)}?${query.toString()}`,
    {
      method: "DELETE",
    },
  );
}
