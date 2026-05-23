import type { UserProfileDto } from "@beefriends/shared-kernel/types";

import { API_BASE_URL, uploadProfilePhoto } from "@/api";

export type ProfilePhotoKind = "profile" | "gallery";

export async function resolveUploadedPhotoUrl(
  accessToken: string,
  photoUri: string,
  kind: ProfilePhotoKind,
) {
  if (!photoUri) return "";
  if (!isLocalPhotoUri(photoUri)) return photoUri;

  const uploadedPhoto = await uploadProfilePhoto(accessToken, photoUri, kind);
  return uploadedPhoto.url;
}

export function getProfilePhotoUri(profile: UserProfileDto | null) {
  return normalizePhotoUri(
    profile?.profilePhotoUrl ||
      profile?.photos?.find((photo) => photo.isProfile)?.url ||
      profile?.photos?.[0]?.url ||
      "",
  );
}

export function getGalleryPhotoUris(profile: UserProfileDto) {
  return (
    profile.photos
      ?.filter((photo) => !photo.isProfile)
      .slice(0, 3)
      .map((photo) => normalizePhotoUri(photo.url)) ?? []
  );
}

export function normalizePhotoUri(photoUri: string) {
  if (!photoUri) return "";

  if (
    photoUri.startsWith("http://") ||
    photoUri.startsWith("https://") ||
    photoUri.startsWith("file://") ||
    photoUri.startsWith("content://") ||
    photoUri.startsWith("data:")
  ) {
    return photoUri;
  }

  if (photoUri.startsWith("/")) {
    return `${API_BASE_URL}${photoUri}`;
  }

  return photoUri;
}

function isLocalPhotoUri(photoUri: string) {
  return (
    photoUri.startsWith("file://") ||
    photoUri.startsWith("content://") ||
    photoUri.startsWith("ph://")
  );
}
