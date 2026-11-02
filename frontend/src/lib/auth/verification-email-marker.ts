import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { verification } from "@/db/auth-schema";

interface IVerificationTokenClaims {
  exp: number;
  updateTo?: string;
}

// better-auth signs this token in process just before the callback, so the payload is read, not verified.
function readVerificationToken(token: string): IVerificationTokenClaims {
  const payload = token.split(".")[1] ?? "";
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

const noRelease = async () => {};

// Verification links are stateless JWTs with no row of their own, so a marker row stands
// in for "a link to this address is still live". Returns null when one already went out,
// otherwise a release to call if the send fails. Change-email tokens carry `updateTo` and
// need a signed-in user, so they always send.
export async function claimVerificationEmail(
  userId: string,
  email: string,
  token: string,
): Promise<(() => Promise<void>) | null> {
  const { exp, updateTo } = readVerificationToken(token);
  if (updateTo) return noRelease;

  const identifier = `verification-email:${userId}`;

  const markerId = await db.transaction(async (tx) => {
    // Serialises overlapping requests for one user, so they cannot both see no marker.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${identifier}))`,
    );

    const live = await tx
      .select({ id: verification.id })
      .from(verification)
      .where(
        and(
          eq(verification.identifier, identifier),
          eq(verification.value, email),
          gt(verification.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (live.length > 0) return null;

    const [marker] = await tx
      .insert(verification)
      .values({ identifier, value: email, expiresAt: new Date(exp * 1000) })
      .returning({ id: verification.id });
    return marker.id;
  });

  if (!markerId) return null;

  return async () => {
    await db.delete(verification).where(eq(verification.id, markerId));
  };
}
