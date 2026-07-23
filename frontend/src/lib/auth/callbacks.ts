import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/db/auth-schema";
import { emailService } from "@/lib/email";

// The reset flow is reused for two cases that read very differently to the user:
//   - an OAuth-only account adding a password for the first time  -> "set your password"
//   - an account that already has a password resetting it          -> "reset your password"
// We pick the wording by checking whether a credential account already exists, so the same
// secure token mechanism serves both the forgot-password and register-existing-email flows.
export async function dispatchResetPasswordEmail(
  userId: string,
  email: string,
  url: string,
  token: string,
) {
  const credential = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (credential.length > 0) {
    await emailService.sendPasswordReset({ to: email, url, token });
  } else {
    await emailService.sendSetPassword({ to: email, url, token });
  }
}

// Returns whether the user has any non-credential (social) account linked. Used to enforce the
// "one email defines the user" invariant.
export async function hasLinkedSocialAccount(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(eq(account.userId, userId), ne(account.providerId, "credential")),
    )
    .limit(1);

  return rows.length > 0;
}

// Non-PII rejection handler for the fire-and-forget email sends, so a failed dispatch surfaces
// in logs instead of becoming an unhandled rejection (without logging recipient addresses).
export function logEmailFailure(kind: string) {
  return (error: unknown) => {
    console.error(
      `Failed to send ${kind} email:`,
      error instanceof Error ? error.name : typeof error,
    );
  };
}
