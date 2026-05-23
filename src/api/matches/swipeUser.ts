import { MATCH_ENDPOINTS } from "@beefriends/shared-kernel";
import type {
  MatchDecision,
  SwipeResultDto,
} from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export type SwipeUserPayload = {
  swiperId: number;
  targetUserId: number;
  decision: MatchDecision;
};

export function swipeUser({
  swiperId,
  targetUserId,
  decision,
}: SwipeUserPayload) {
  return requestJson<SwipeResultDto>(MATCH_ENDPOINTS.SWIPE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      swiperId,
      targetUserId,
      decision,
    }),
  });
}
