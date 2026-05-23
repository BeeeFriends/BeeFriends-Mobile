import { USER_ENDPOINTS } from "@beefriends/shared-kernel";
import type { UserProfileDto } from "@beefriends/shared-kernel/types";

import { requestJson } from "@/api/client";

export function getUserProfileById(accessToken: string, userId: number) {
  return requestJson<UserProfileDto>(USER_ENDPOINTS.BY_ID(userId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
