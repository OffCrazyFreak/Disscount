import "server-only";

import { and, eq, gt, like, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { verification } from "@/db/auth-schema";

// The prefix better-auth gives the verification row behind each reset link.
const RESET_PREFIX = "reset-password:";

// better-auth writes this link's row before calling sendResetPassword, so the row to
// compare against is any live one for the same user created earlier.
export async function hasEarlierLiveResetLink(userId: string, token: string) {
  const own = db
    .select({ createdAt: verification.createdAt, id: verification.id })
    .from(verification)
    .where(eq(verification.identifier, `${RESET_PREFIX}${token}`));

  const earlier = await db
    .select({ id: verification.id })
    .from(verification)
    .where(
      and(
        eq(verification.value, userId),
        like(verification.identifier, `${RESET_PREFIX}%`),
        ne(verification.identifier, `${RESET_PREFIX}${token}`),
        gt(verification.expiresAt, new Date()),
        // The id breaks a same-millisecond tie, so of two concurrent requests exactly one sends.
        sql`(${verification.createdAt}, ${verification.id}) < (${own})`,
      ),
    )
    .limit(1);

  return earlier.length > 0;
}

// An unsent link must not count as live, or it would hold back the next request's email.
export async function discardResetLink(token: string) {
  await db
    .delete(verification)
    .where(eq(verification.identifier, `${RESET_PREFIX}${token}`));
}
