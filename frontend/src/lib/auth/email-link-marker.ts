import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { verification } from "@/db/auth-schema";
import { RESET_TOKEN_TTL_SECONDS } from "@/constants/auth";
import { inboxKey } from "@/lib/email/recipient-send-cap";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// A marker row records the last link mailed for one purpose, so a repeat request sends
// nothing while that link still works. Returns null to skip the send, otherwise a release
// to call if the send fails, so the next request retries.
async function claimMarker(
  identifier: string,
  value: string,
  expiresAt: Date,
  isStillUsable: (tx: Transaction, markedValue: string) => Promise<boolean>,
) {
  const markerId = await db.transaction(async (tx) => {
    // Serialises overlapping requests for one user, so exactly one of them sends.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${identifier}))`,
    );

    const [marker] = await tx
      .select({ value: verification.value })
      .from(verification)
      .where(
        and(
          eq(verification.identifier, identifier),
          gt(verification.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (marker && (await isStillUsable(tx, marker.value))) return null;

    await tx
      .delete(verification)
      .where(eq(verification.identifier, identifier));
    const [created] = await tx
      .insert(verification)
      .values({ identifier, value, expiresAt })
      .returning({ id: verification.id });
    return created.id;
  });

  if (!markerId) return null;

  return async () => {
    await db.delete(verification).where(eq(verification.id, markerId));
  };
}

// The marked link counts only while its reset row lives: using the link deletes the row,
// so a later forgot-password request mails a new one. Assumes the default plain
// verification.storeIdentifier, the form better-auth writes `reset-password:<token>` in.
export function claimResetEmail(userId: string, token: string) {
  return claimMarker(
    `reset-email:${userId}`,
    token,
    new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1000),
    async (tx, markedToken) => {
      const live = await tx
        .select({ id: verification.id })
        .from(verification)
        .where(
          and(
            eq(verification.identifier, `reset-password:${markedToken}`),
            gt(verification.expiresAt, new Date()),
          ),
        )
        .limit(1);
      return live.length > 0;
    },
  );
}

interface IVerificationTokenClaims {
  email: string;
  exp: number;
  updateTo?: string;
}

// better-auth signs this token in process just before the callback, so the payload is read, not verified.
function readVerificationToken(token: string): IVerificationTokenClaims {
  const payload = token.split(".")[1] ?? "";
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

// Verification links are stateless JWTs, so the marker carries what the link is for and
// the token's expiry. A change-email link (`updateTo`) gets a marker per target inbox, since
// its confirmation link needs no session and mails the new address on every reload; the
// value is the current address, because the link stops working once that changes.
export async function claimVerificationEmail(userId: string, token: string) {
  const { email, exp, updateTo } = readVerificationToken(token);
  const [identifier, value] = updateTo
    ? [`change-email:${userId}:${inboxKey(updateTo)}`, email]
    : [`verification-email:${userId}`, email];

  return claimMarker(
    identifier,
    value,
    new Date(exp * 1000),
    async (_tx, markedValue) => markedValue === value,
  );
}
