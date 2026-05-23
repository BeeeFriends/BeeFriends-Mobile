import { requestJson } from "@/api/client";

type UploadedChatAttachment = {
  objectName: string;
  url: string;
};

type FormDataFile = {
  name: string;
  type: string;
  uri: string;
};

export function uploadUserImage(
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
