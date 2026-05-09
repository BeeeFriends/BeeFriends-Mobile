import { USER_ENDPOINTS } from "@beefriends/shared-kernel";
import type {
  UpdateUserDto,
  UserProfileDto,
} from "@beefriends/shared-kernel/types";

import { requestJson } from "./client";

type UploadedChatAttachment = {
  objectName: string;
  url: string;
};

type FormDataFile = {
  name: string;
  type: string;
  uri: string;
};

export function getCurrentUserProfile(accessToken: string) {
  return requestJson<UserProfileDto>(USER_ENDPOINTS.ME, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getUserProfileById(accessToken: string, userId: number) {
  return requestJson<UserProfileDto>(USER_ENDPOINTS.BY_ID(userId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

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

export function uploadChatAttachment(accessToken: string, imageUri: string) {
  return uploadUserImage(
    accessToken,
    imageUri,
    "chat-image",
    USER_ENDPOINTS.CHAT_ATTACHMENTS,
  );
}

export async function uploadProfilePhoto(
  accessToken: string,
  imageUri: string,
  kind: "profile" | "gallery" = "gallery",
) {
  try {
    return await uploadUserImage(
      accessToken,
      imageUri,
      `${kind}-photo`,
      USER_ENDPOINTS.PROFILE_PHOTOS,
      { kind },
    );
  } catch {
    return uploadUserImage(
      accessToken,
      imageUri,
      `${kind}-photo`,
      USER_ENDPOINTS.CHAT_ATTACHMENTS,
    );
  }
}

function uploadUserImage(
  accessToken: string,
  imageUri: string,
  fallbackName: string,
  endpoint: string,
  fields: Record<string, string> = {},
) {
  const formData = new FormData();

  formData.append(
    "image",
    createFormDataFile(imageUri, fallbackName) as unknown as Blob,
  );

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return requestJson<UploadedChatAttachment>(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
}

function createFormDataFile(uri: string, fallbackName: string): FormDataFile {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase() || "jpg";

  return {
    uri,
    name: `${fallbackName}.${extension}`,
    type: getImageMimeType(extension),
  };
}

function getImageMimeType(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";

  return "image/jpeg";
}
