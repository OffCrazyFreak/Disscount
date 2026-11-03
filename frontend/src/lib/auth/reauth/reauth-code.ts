import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { APIError } from "better-auth/api";
import type { GenericEndpointContext } from "better-auth";

import {
  REAUTH_CODE_LENGTH,
  REAUTH_CODE_RESEND_SECONDS,
  REAUTH_CODE_TTL_MINUTES,
} from "@/constants/auth";
import {
  CODE_EXPIRED,
  CODE_RESEND_TOO_SOON,
  INVALID_CODE,
} from "@/lib/auth/security-policy";

const REAUTH_CODE_MAX_ATTEMPTS = 3;

interface IStoredCode {
  hash: string;
  attempts: number;
}

type InternalAdapter = GenericEndpointContext["context"]["internalAdapter"];

function identifierFor(userId: string) {
  return `reauth-code:${userId}`;
}

// Keyed with the auth secret, so a database read alone cannot brute-force the six digits.
function hashCode(secret: string, userId: string, code: string) {
  return createHmac("sha256", secret).update(`${userId}:${code}`).digest("hex");
}

function matches(storedHash: string, candidateHash: string) {
  const stored = Buffer.from(storedHash, "hex");
  const candidate = Buffer.from(candidateHash, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}

function parseStored(value: string): IStoredCode | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === "object" &&
      "hash" in parsed &&
      "attempts" in parsed &&
      typeof parsed.hash === "string" &&
      typeof parsed.attempts === "number"
    ) {
      return { hash: parsed.hash, attempts: parsed.attempts };
    }
  } catch {}
  return null;
}

/** Stores a new code for the user, replacing any earlier one, and returns it in clear. */
export async function issueReauthCode(
  adapter: InternalAdapter,
  secret: string,
  userId: string,
): Promise<{ code: string; codeId: string }> {
  const identifier = identifierFor(userId);
  const previous = await adapter.findVerificationValue(identifier);
  const resendAt =
    previous && previous.createdAt.getTime() + REAUTH_CODE_RESEND_SECONDS * 1000;

  if (resendAt && resendAt > Date.now()) {
    throw new APIError("TOO_MANY_REQUESTS", {
      code: CODE_RESEND_TOO_SOON,
      message: "Wait before asking for another code",
      retryAfter: Math.ceil((resendAt - Date.now()) / 1000),
    });
  }

  const code = String(randomInt(0, 10 ** REAUTH_CODE_LENGTH)).padStart(
    REAUTH_CODE_LENGTH,
    "0",
  );

  await adapter.deleteVerificationByIdentifier(identifier);
  const stored = await adapter.createVerificationValue({
    identifier,
    value: JSON.stringify({
      hash: hashCode(secret, userId, code),
      attempts: 0,
    } satisfies IStoredCode),
    expiresAt: new Date(Date.now() + REAUTH_CODE_TTL_MINUTES * 60 * 1000),
  });

  return { code, codeId: stored.id };
}

export async function discardReauthCode(adapter: InternalAdapter, userId: string) {
  await adapter.deleteVerificationByIdentifier(identifierFor(userId));
}

/**
 * Spends the user's code: resolves on a match, otherwise throws with the tries left.
 * The row is consumed atomically first, so two parallel guesses can never both count as one try.
 */
export async function consumeReauthCode(
  adapter: InternalAdapter,
  secret: string,
  userId: string,
  code: string,
): Promise<void> {
  const identifier = identifierFor(userId);
  const row = await adapter.consumeVerificationValue(identifier);
  const stored = row ? parseStored(row.value) : null;

  if (!row || !stored) {
    throw new APIError("BAD_REQUEST", {
      code: CODE_EXPIRED,
      message: "The code expired or was used up",
      attemptsLeft: 0,
    });
  }

  if (matches(stored.hash, hashCode(secret, userId, code))) return;

  const attempts = stored.attempts + 1;
  const attemptsLeft = REAUTH_CODE_MAX_ATTEMPTS - attempts;

  if (attemptsLeft > 0) {
    await adapter.createVerificationValue({
      identifier,
      value: JSON.stringify({ hash: stored.hash, attempts } satisfies IStoredCode),
      expiresAt: row.expiresAt,
      // Kept, so a wrong guess does not restart the resend countdown.
      createdAt: row.createdAt,
    });
  }

  throw new APIError("BAD_REQUEST", {
    code: attemptsLeft > 0 ? INVALID_CODE : CODE_EXPIRED,
    message: "The code is not correct",
    attemptsLeft,
  });
}
