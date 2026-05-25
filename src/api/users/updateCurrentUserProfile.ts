import { USER_ENDPOINTS } from "@beefriends/shared-kernel";
import type { UpdateUserDto, UserProfileDto } from "@beefriends/shared-kernel/types";

import { API_BASE_URL, requestJson } from "@/api/client";

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
    body: JSON.stringify(normalizeProfilePhotoPayload(payload)),
  });
}

function normalizeProfilePhotoPayload(payload: UpdateUserDto): UpdateUserDto {
  return {
    ...payload,
    profilePhotoUrl:
      payload.profilePhotoUrl === undefined
        ? undefined
        : toRelativeStoragePath(payload.profilePhotoUrl),
    photoUrls: payload.photoUrls?.map(toRelativeStoragePath),
  };
}

function toRelativeStoragePath(url: string) {
  const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, "");

  if (url.startsWith(`${normalizedBaseUrl}/storage/`)) {
    return url.slice(normalizedBaseUrl.length);
  }

  return url;
}
