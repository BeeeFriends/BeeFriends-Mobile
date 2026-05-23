export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}
