import { USER_ENDPOINTS } from "@beefriends/shared-kernel";
import type { UserProfileDto } from "@beefriends/shared-kernel/types";

import { requestJson } from "@/api/client";

export function getCurrentUserProfile(accessToken: string) {
  return requestJson<UserProfileDto>(USER_ENDPOINTS.ME, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
