// One home for this, because the auth hook guard, our account routes and the settings dialog all read it.
export const REAUTH_WINDOW_SECONDS = 15 * 60;

export const REAUTH_REQUIRED = "REAUTH_REQUIRED";
export const INVALID_CODE = "INVALID_CODE";
export const CODE_EXPIRED = "CODE_EXPIRED";
export const CODE_RESEND_TOO_SOON = "CODE_RESEND_TOO_SOON";

// "proof": password or code in this request; "fresh": session made or rotated in the window; "blocked": never HTTP.
export type SensitiveRequirement = "proof" | "fresh" | "blocked";

// setPassword has no path, so /api/account/set-password applies the "fresh" rule itself.
export const SENSITIVE_PATHS: Readonly<Record<string, SensitiveRequirement>> = {
  "/delete-user": "proof",
  "/change-email": "fresh",
  "/unlink-account": "fresh",
  // Answers with every session's bearer token; the settings list uses /api/account/sessions.
  "/list-sessions": "blocked",
};

export function isFreshSession(
  createdAt: Date | string,
  now: number = Date.now(),
): boolean {
  return now - new Date(createdAt).getTime() < REAUTH_WINDOW_SECONDS * 1000;
}
