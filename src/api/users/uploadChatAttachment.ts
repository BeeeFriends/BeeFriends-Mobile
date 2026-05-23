import { USER_ENDPOINTS } from "@beefriends/shared-kernel";

import { uploadUserImage } from "./uploadUserImage";

export function uploadChatAttachment(accessToken: string, imageUri: string) {
  return uploadUserImage(
    accessToken,
    imageUri,
    "chat-image",
    USER_ENDPOINTS.CHAT_ATTACHMENTS,
  );
}
