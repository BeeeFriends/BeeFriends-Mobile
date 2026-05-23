export function getFirebaseAuthErrorMessage(error: unknown) {
  const code = getFirebaseErrorCode(error);

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

  if (
    error instanceof Error &&
    error.message.startsWith("Missing Firebase config")
  ) {
    return "Authentication is not configured in this build. Please rebuild with Firebase environment variables.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Authentication failed. Try again.";
}

function getFirebaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
}
