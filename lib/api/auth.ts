import { AUTH_ENDPOINTS } from "@beefriends/shared-kernel";
import type {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
} from "@beefriends/shared-kernel/types";

import { requestJson } from "./client";

type RegisterAccountPayload = RegisterDto & {
  profilePhotoUri: string;
  photoUris?: string[];
};

type FormDataFile = {
  name: string;
  type: string;
  uri: string;
};

export async function registerAccount({
  profilePhotoUri,
  photoUris = [],
  ...payload
}: RegisterAccountPayload): Promise<AuthResponseDto> {
  const formData = new FormData();

  formData.append("binusianEmail", payload.binusianEmail);
  formData.append("password", payload.password);
  formData.append("phoneNumber", payload.phoneNumber);
  formData.append("displayName", payload.displayName);
  formData.append("binusianYear", String(payload.binusianYear));
  formData.append("majorId", String(payload.majorId));
  formData.append("campusId", String(payload.campusId));
  formData.append("hobbyIds", JSON.stringify(payload.hobbyIds));

  if (payload.description) {
    formData.append("description", payload.description);
  }

  formData.append(
    "profilePhoto",
    createFormDataFile(profilePhotoUri, "profile-photo") as unknown as Blob,
  );

  photoUris.filter(Boolean).forEach((uri, index) => {
    formData.append(
      "photos",
      createFormDataFile(uri, `photo-${index + 1}`) as unknown as Blob,
    );
  });

  return requestJson<AuthResponseDto>(AUTH_ENDPOINTS.REGISTER, {
    method: "POST",
    body: formData,
  });
}

export async function loginAccount(
  binusianEmail: string,
  password: string,
): Promise<AuthResponseDto> {
  const payload: LoginDto = { binusianEmail, password };

  return requestJson<AuthResponseDto>(AUTH_ENDPOINTS.LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function createFormDataFile(uri: string, fallbackName: string): FormDataFile {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase() || "jpg";
  const type = getImageMimeType(extension);
  const name = `${fallbackName}.${extension}`;

  return { uri, name, type };
}

function getImageMimeType(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";

  return "image/jpeg";
}
