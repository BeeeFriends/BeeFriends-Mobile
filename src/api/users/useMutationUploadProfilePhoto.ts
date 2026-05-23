import { useMutation } from "@tanstack/react-query";

import { uploadProfilePhoto } from "@/api/users/uploadProfilePhoto";

type UploadProfilePhotoPayload = {
  accessToken: string;
  imageUri: string;
  kind?: "profile" | "gallery";
};

export function useMutationUploadProfilePhoto() {
  return useMutation({
    mutationFn: ({ accessToken, imageUri, kind }: UploadProfilePhotoPayload) =>
      uploadProfilePhoto(accessToken, imageUri, kind),
  });
}
