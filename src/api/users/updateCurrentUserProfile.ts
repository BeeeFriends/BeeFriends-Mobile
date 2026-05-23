import { USER_ENDPOINTS } from "@beefriends/shared-kernel";
import type { UpdateUserDto, UserProfileDto } from "@beefriends/shared-kernel/types";

import { requestJson } from "@/api/client";

export function updateCurrentUserProfile(
  accessToken: string,
  payload: UpdateUserDto,
) {
  return requestJson<UserProfileDto>(USER_ENDPOINTS.ME, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
