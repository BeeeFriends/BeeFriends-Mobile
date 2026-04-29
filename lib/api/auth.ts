import { AUTH_ENDPOINTS } from "@beefriends/shared-kernel";
import type {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
} from "@beefriends/shared-kernel/types";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { requestJson } from "./client";
import { firebaseAuth } from "../firebase/client";

const FIREBASE_LOGIN_ENDPOINT = "/api/v1/user/auth/firebase-login";

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
  let firebaseUser = null;

  try {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      payload.binusianEmail,
      payload.password,
    );
    firebaseUser = credential.user;

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
    if (firebaseUser) {
      await firebaseUser.delete().catch(() => undefined);
    }

    throw new Error(getFirebaseAuthErrorMessage(error));
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
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    payload.binusianEmail,
    payload.password,
  ).catch((error) => {
    throw new Error(getFirebaseAuthErrorMessage(error));
  });
  const idToken = await credential.user.getIdToken();

  return requestJson<AuthResponseDto>(FIREBASE_LOGIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });
}

function getFirebaseAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (
    code === "auth/invalid-credential" ||
    code === "auth/invalid-email" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  ) {
    return "Email or password is incorrect.";
  }

  if (code === "auth/email-already-in-use") {
    return "Email already registered.";
  }

  if (code === "auth/weak-password") {
    return "Password is too weak.";
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Authentication failed. Try again.";
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
