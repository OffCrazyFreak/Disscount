import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { User } from "better-auth";

import { db } from "@/db";
import { verification } from "@/db/auth-schema";
import { RESET_TOKEN_TTL_SECONDS } from "@/constants/auth";
import type { AppLocale } from "@/i18n/locales";
import { localePath } from "@/i18n/locale-path";
import { appUrl, requireEnv } from "@/lib/env";
import { emailService } from "@/lib/email";
import { userLocale } from "@/lib/email/email-copy";
import {
  claimResetEmail,
  claimSignUpNotice,
} from "@/lib/auth/email-link-marker";

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");

// A sign-up with a registered address answers the caller like a new one and tells the
// owner instead. An unverified owner gets a set-password link, because the password on
// file may be a squatter's and the link is the only proof of the inbox.
export async function notifyExistingAccount(user: User) {
  const noticeId = randomUUID();
  const release = await claimSignUpNotice(user.id, noticeId);
  if (!release) return;

  const locale = userLocale(user);

  try {
    const sent = user.emailVerified
      ? await sendAccountExists(user.email, locale, noticeId)
      : await sendCompleteSignUp(user.id, user.email, locale);

    if (!sent) await release();
  } catch (error) {
    // The send error is the one worth logging, not a failed release.
    await release().catch(() => {});
    throw error;
  }
}

async function sendAccountExists(
  email: string,
  locale: AppLocale,
  noticeId: string,
) {
  await emailService.sendAccountExists({
    to: email,
    locale,
    url: `${appUrl()}${localePath(locale, "/?modal=login")}`,
    token: noticeId,
  });
  return true;
}

async function sendCompleteSignUp(
  userId: string,
  email: string,
  locale: AppLocale,
) {
  const token = randomBytes(32).toString("base64url");
  const identifier = `reset-password:${token}`;

  // Same row shape requestPasswordReset writes, so the stock /reset-password consumes it.
  // Written before the claim, so a concurrent forgot-password request sees this link as live.
  await db.insert(verification).values({
    identifier,
    value: userId,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1000),
  });

  const releaseReset = await claimResetEmail(userId, token).catch(
    async (error: unknown) => {
      await deleteResetRow(identifier);
      throw error;
    },
  );

  // A live reset link already reaches this inbox, and it does the same job.
  if (!releaseReset) {
    await deleteResetRow(identifier);
    return false;
  }

  try {
    const callbackURL = encodeURIComponent(
      `${appUrl()}${localePath(locale, "/reset-password")}`,
    );

    await emailService.sendCompleteSignUp({
      to: email,
      locale,
      url: `${BETTER_AUTH_URL}/api/auth/reset-password/${token}?callbackURL=${callbackURL}`,
      token,
    });
  } catch (error) {
    await releaseReset().catch(() => {});
    await deleteResetRow(identifier);
    throw error;
  }

  return true;
}

async function deleteResetRow(identifier: string) {
  await db
    .delete(verification)
    .where(eq(verification.identifier, identifier))
    .catch(() => {});
}
