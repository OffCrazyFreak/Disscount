import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/db/auth-schema";
import type { AppLocale } from "@/i18n/locales";
import { emailService } from "@/lib/email";
import {
  claimResetEmail,
  claimVerificationEmail,
} from "@/lib/auth/email-link-marker";

// One token mechanism, two wordings: "set" for OAuth-only accounts, "reset" otherwise.
export async function dispatchResetPasswordEmail(
  userId: string,
  email: string,
  url: string,
  token: string,
  locale: AppLocale,
) {
  // A live link already sits in the inbox: a repeat costs the address none of its email cap.
  const release = await claimResetEmail(userId, token);
  if (!release) return;

  try {
    await sendResetOrSetPassword(userId, email, url, token, locale);
  } catch (error) {
    // The send error is the one worth logging, not a failed release.
    await release().catch(() => {});
    throw error;
  }
}

async function sendResetOrSetPassword(
  userId: string,
  email: string,
  url: string,
  token: string,
  locale: AppLocale,
) {
  const credential = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (credential.length > 0) {
    await emailService.sendPasswordReset({ to: email, locale, url, token });
  } else {
    await emailService.sendSetPassword({ to: email, locale, url, token });
  }
}

// Same rule as the reset link: no new verification email while the last one is still live.
export async function dispatchVerificationEmail(
  userId: string,
  email: string,
  url: string,
  token: string,
  locale: AppLocale,
) {
  const release = await claimVerificationEmail(userId, token);
  if (!release) return;

  try {
    await emailService.sendVerificationEmail({ to: email, locale, url, token });
  } catch (error) {
    // The send error is the one worth logging, not a failed release.
    await release().catch(() => {});
    throw error;
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
