import { MATCH_ENDPOINTS } from "@beefriends/shared-kernel";
import type { MatchProfileDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export type DiscoverMatchesParams = {
  userId: number;
  limit?: number;
  campusId?: number;
  majorId?: number;
  hobbyIds?: number[];
};

export async function discoverMatches({
  userId,
  limit = 20,
  campusId,
  majorId,
  hobbyIds,
}: DiscoverMatchesParams) {
  const query = new URLSearchParams({
    userId: String(userId),
    limit: String(limit),
  });

  if (campusId) query.set("campusId", String(campusId));
  if (majorId) query.set("majorId", String(majorId));
  if (hobbyIds?.length) query.set("hobbyIds", JSON.stringify(hobbyIds));

  return requestJson<MatchProfileDto[]>(
    `${MATCH_ENDPOINTS.DISCOVER}?${query.toString()}`,
  );
}
