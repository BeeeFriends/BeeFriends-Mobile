import { AUTH_ENDPOINTS } from "@beefriends/shared-kernel";
import type { AuthResponseDto, RegisterDto } from "@beefriends/shared-kernel/types";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { requestJson } from "@/api/client";
import { getFirebaseAuth } from "@/lib/firebase";

import { getFirebaseAuthErrorMessage } from "./helpers";

export type RegisterAccountPayload = RegisterDto & {
  gender: string;
  age: number;
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
  let firebaseUser = null;
  let createdFirebaseUser = false;

  try {
    const firebaseCredential = await createOrSignInFirebaseUser(
      payload.binusianEmail,
      payload.password,
    );
    const credential = firebaseCredential.credential;
    firebaseUser = credential.user;
    createdFirebaseUser = firebaseCredential.created;

    if (payload.displayName) {
      await updateProfile(firebaseUser, {
        displayName: payload.displayName,
      });
    }

    const firebaseIdToken = await firebaseUser.getIdToken();

    return await registerBackendAccount({
      profilePhotoUri,
      photoUris,
      payload,
      firebaseIdToken,
    });
  } catch (error) {
    if (firebaseUser && createdFirebaseUser) {
      await firebaseUser.delete().catch(() => undefined);
    }

    throw new Error(getFirebaseAuthErrorMessage(error));
  }
}

async function createOrSignInFirebaseUser(
  binusianEmail: string,
  password: string,
) {
  try {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      binusianEmail,
      password,
    );

    return { credential, created: true };
  } catch (error) {
    if (getFirebaseErrorCode(error) !== "auth/email-already-in-use") {
      throw error;
    }

    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      binusianEmail,
      password,
    );

    return { credential, created: false };
  }
}

async function registerBackendAccount({
  profilePhotoUri,
  photoUris,
  payload,
  firebaseIdToken,
}: {
  profilePhotoUri: string;
  photoUris: string[];
  payload: RegisterDto;
  firebaseIdToken: string;
}) {
  const formData = new FormData();

  formData.append("binusianEmail", payload.binusianEmail);
  formData.append("firebaseIdToken", firebaseIdToken);
  formData.append("phoneNumber", payload.phoneNumber);
  formData.append("displayName", payload.displayName);
  formData.append("gender", payload.gender);
  formData.append("age", String(payload.age));
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

function getFirebaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
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
