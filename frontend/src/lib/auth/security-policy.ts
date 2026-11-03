// One home for "did this person prove it recently?": the auth hook guard, our own
// account routes and the settings dialog all read this.
export const REAUTH_WINDOW_SECONDS = 15 * 60;

export const REAUTH_REQUIRED = "REAUTH_REQUIRED";
export const INVALID_CODE = "INVALID_CODE";
export const CODE_EXPIRED = "CODE_EXPIRED";
export const CODE_RESEND_TOO_SOON = "CODE_RESEND_TOO_SOON";

// "proof": a password or emailed code in this very request. "fresh": a session
// created, or rotated by a proof, inside the window. "blocked": never over HTTP.
export type SensitiveRequirement = "proof" | "fresh" | "blocked";

// better-auth's own paths. setPassword is server-only with no path, so
// /api/account/set-password applies the "fresh" rule itself.
export const SENSITIVE_PATHS: Readonly<Record<string, SensitiveRequirement>> =
  {
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
