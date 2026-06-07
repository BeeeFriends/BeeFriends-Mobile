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
    profilePhotoUrl: payload.profilePhotoUrl
      ? toBackendPhotoUrl(payload.profilePhotoUrl)
      : undefined,
    photoUrls: payload.photoUrls?.map(toBackendPhotoUrl).filter(Boolean),
  };
}

function toBackendPhotoUrl(url: string) {
  const trimmedUrl = url.trim();
  const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, "");

  if (!trimmedUrl) return "";

  if (trimmedUrl.startsWith("/storage/")) {
    return `${normalizedBaseUrl}${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("storage/")) {
    return `${normalizedBaseUrl}/${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("/users/")) {
    return `${normalizedBaseUrl}/storage${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("users/")) {
    return `${normalizedBaseUrl}/storage/${trimmedUrl}`;
  }

  return trimmedUrl;
}
