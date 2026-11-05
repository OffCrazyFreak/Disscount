import "server-only";

import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth/api";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";

// Shared with backend SecurityConfig, which lets only this purpose call DELETE /api/users/me.
const ACCOUNT_ERASURE_PURPOSE = "account-erasure";
// One server to server call needs seconds; anything longer only widens a leak.
const ERASURE_TOKEN_TTL_SECONDS = 60;
// A hung backend has to fail the deletion rather than hold the request open.
const ERASURE_TIMEOUT_MS = 15_000;

export type SignJwt = (payload: Record<string, unknown>) => Promise<string>;

/** As beforeDelete, throwing aborts before the identity is touched, leaving the account whole. */
export async function eraseBackendAccount(
  userId: string,
  signJwt: SignJwt,
): Promise<void> {
  const issuedAt = Math.floor(Date.now() / 1000);
  // No email claim, so the backend's provisioning filter never creates a profile just to erase it.
  const token = await signJwt({
    sub: userId,
    purpose: ACCOUNT_ERASURE_PURPOSE,
    iat: issuedAt,
    exp: issuedAt + ERASURE_TOKEN_TTL_SECONDS,
  });

  let status: number | string;
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/api/users/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(ERASURE_TIMEOUT_MS),
    });
    if (response.ok) return;
    status = response.status;
  } catch (error) {
    status = error instanceof Error ? error.name : typeof error;
  }

  console.error("Backend account erasure failed:", status);
  // Only the account id identifies the user; every deletion fails while this keeps firing.
  Sentry.captureException(
    new Error(`Backend account erasure failed: ${status}`),
    { tags: { flow: "account-erasure" }, user: { id: userId } },
  );
  throw new APIError("INTERNAL_SERVER_ERROR", {
    message: "Account erasure failed; nothing was deleted",
  });
}
