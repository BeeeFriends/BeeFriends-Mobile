import { useMutation } from "@tanstack/react-query";

import { uploadChatAttachment } from "@/api/users/uploadChatAttachment";

type UploadChatAttachmentPayload = {
  accessToken: string;
  imageUri: string;
};

export function useMutationUploadChatAttachment() {
  return useMutation({
    mutationFn: ({ accessToken, imageUri }: UploadChatAttachmentPayload) =>
      uploadChatAttachment(accessToken, imageUri),
  });
}
