const messageByCode: Record<string, string> = {
  unauthenticated: "Your secure request could not be verified. Please sign in with Google again.",
  "permission-denied": "This account deletion request was not authorized. Please sign in with Google again.",
  "failed-precondition": "The account is not ready for deletion. Please sign in with Google again and retry.",
  "already-exists": "This Mr. Copy account has already been deleted.",
  "deadline-exceeded": "The account deletion service timed out. Please try again later.",
  unavailable: "The account deletion service is temporarily unavailable. Please try again later.",
  internal: "The account deletion service is temporarily unavailable. Please try again later.",
};

export function deletionErrorMessage(cause: unknown): string {
  if (typeof cause === "object" && cause) {
    const rawCode = "code" in cause && typeof cause.code === "string" ? cause.code : "";
    const code = rawCode.replace(/^functions\//, "");
    if (messageByCode[code]) return messageByCode[code];
  }
  return "Account deletion could not be completed. Please try again later.";
}
