import "server-only";

import { isAPIError } from "better-auth/api";

import { auth } from "@/lib/auth";

export interface ISessionToken {
  token: string;
  userId: string;
}

function subjectOf(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  // Not verified: this server signed it a moment ago.
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    sub?: unknown;
  };
  return typeof claims.sub === "string" ? claims.sub : null;
}

/** Minted per request and never cached, so a revoked session stops at its next call; anything but "no session" throws. */
export async function mintSessionToken(
  headers: Headers,
): Promise<ISessionToken | null> {
  try {
    const { token } = await auth.api.getToken({ headers });
    const userId = subjectOf(token);
    return userId ? { token, userId } : null;
  } catch (error) {
    if (isAPIError(error) && error.statusCode === 401) return null;
    throw error;
  }
}
