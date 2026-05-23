import { USER_ENDPOINTS } from "@beefriends/shared-kernel";

import { uploadUserImage } from "./uploadUserImage";

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
