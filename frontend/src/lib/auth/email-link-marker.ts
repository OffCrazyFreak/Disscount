import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { verification } from "@/db/auth-schema";
import { RESET_TOKEN_TTL_SECONDS } from "@/constants/auth";
import { inboxKey } from "@/lib/email/recipient-send-cap";
import { readVerificationToken } from "@/lib/auth/verification-token";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Returns null to skip the send, otherwise a release to call if the send fails, so the next request retries.
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

// Using the link deletes the reset row, so a later request mails a new one; assumes plain verification.storeIdentifier for `reset-password:<token>`.
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

// Stateless JWTs, so the marker holds purpose and expiry; change-email gets one per target inbox, because its link mails on every reload.
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

const SIGN_UP_NOTICE_INTERVAL_SECONDS = 60 * 60;

// Nobody asked for this mail, so any unexpired marker blocks the next one: at most one per user per hour.
export function claimSignUpNotice(userId: string, noticeId: string) {
  return claimMarker(
    `sign-up-notice:${userId}`,
    noticeId,
    new Date(Date.now() + SIGN_UP_NOTICE_INTERVAL_SECONDS * 1000),
    async () => true,
  );
}
