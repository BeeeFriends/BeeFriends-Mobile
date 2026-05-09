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
  const formData = new FormData();

  formData.append(
    "image",
    createFormDataFile(imageUri, "chat-image") as unknown as Blob,
  );

  return requestJson<UploadedChatAttachment>("/v1/user/users/me/chat-attachments", {
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
