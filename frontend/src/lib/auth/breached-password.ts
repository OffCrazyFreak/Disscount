import "server-only";

import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth/api";
import { pwnedPassword } from "hibp";

import {
  PASSWORD_BREACHED,
  PASSWORD_BREACHED_MESSAGE,
  PASSWORD_LENGTH_INVALID,
  PASSWORD_LENGTH_MESSAGE,
  passwordLengthError,
} from "@/lib/auth/password-policy";

export type BreachCheck = "breached" | "ok" | "unknown";

const NEW_PASSWORD_TIMEOUT_MS = 3000;
// Every sign-in waits on this, so it gets the tighter budget.
export const SIGN_IN_TIMEOUT_MS = 1500;

// k-anonymity: only the first 5 hex chars of the SHA-1 leave the server, padded so
// response size can't hint at the match either.
export async function checkBreached(
  password: string,
  timeoutMs: number,
): Promise<BreachCheck> {
  try {
    // NFKC is what gets hashed, so a fullwidth copy of a leaked password is the same password.
    const count = await pwnedPassword(password.normalize("NFKC"), {
      addPadding: true,
      timeoutMs,
      userAgent: "Disscount (https://disscount.me)",
    });

    return count > 0 ? "breached" : "ok";
  } catch (error) {
    // Fails open: an HIBP outage must not lock everyone out. Error name only, never input.
    Sentry.captureMessage(
      `Pwned Passwords check skipped: ${error instanceof Error ? error.name : typeof error}`,
      "warning",
    );

    return "unknown";
  }
}

// Every path that sets a password runs this before the password is hashed.
export async function assertPasswordAcceptable(password: string) {
  const lengthError = passwordLengthError(password);
  if (lengthError) {
    throw new APIError("BAD_REQUEST", {
      code: PASSWORD_LENGTH_INVALID,
      message: PASSWORD_LENGTH_MESSAGE,
    });
  }

  if ((await checkBreached(password, NEW_PASSWORD_TIMEOUT_MS)) === "breached") {
    throw new APIError("BAD_REQUEST", {
      code: PASSWORD_BREACHED,
      message: PASSWORD_BREACHED_MESSAGE,
    });
  }
}
