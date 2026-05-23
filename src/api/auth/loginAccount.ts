import { signInWithEmailAndPassword } from "firebase/auth";
import type { UserCredential } from "firebase/auth";
import type { AuthResponseDto, LoginDto } from "@beefriends/shared-kernel/types";

import { requestJson } from "@/api/client";
import { getFirebaseAuth } from "@/lib/firebase";

import { getFirebaseAuthErrorMessage } from "./helpers";

const FIREBASE_LOGIN_ENDPOINT = "/v1/user/auth/firebase-login";

export async function loginAccount(
  binusianEmail: string,
  password: string,
): Promise<AuthResponseDto> {
  const payload: LoginDto = { binusianEmail, password };

  let credential: UserCredential;
  try {
    credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      payload.binusianEmail,
      payload.password,
    );
  } catch (error) {
    throw new Error(getFirebaseAuthErrorMessage(error));
  }

  const idToken = await credential.user.getIdToken();

  return requestJson<AuthResponseDto>(FIREBASE_LOGIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });
}
