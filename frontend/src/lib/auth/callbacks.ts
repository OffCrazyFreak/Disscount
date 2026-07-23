import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/db/auth-schema";
import { emailService } from "@/lib/email";

// One token mechanism, two wordings: "set" for OAuth-only accounts, "reset" otherwise.
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

// Reports a linked non-credential account so callers can enforce "one email defines the user".
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

// Logs a failed fire-and-forget send without ever logging the recipient address.
export function logEmailFailure(kind: string) {
  return (error: unknown) => {
    console.error(
      `Failed to send ${kind} email:`,
      error instanceof Error ? error.name : typeof error,
    );
  };
}
