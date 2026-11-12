import "server-only";

import { randomBytes } from "node:crypto";
import { APIError } from "better-auth/api";
import type { GenericEndpointContext } from "better-auth";

import { appUrl } from "@/lib/env";
import { emailService } from "@/lib/email";
import { userLocale } from "@/lib/email/email-copy";
import { localePath } from "@/i18n/locale-path";
import { logEmailFailure } from "@/lib/auth/callbacks";
import {
  SIGN_IN_TIMEOUT_MS,
  checkBreached,
} from "@/lib/auth/breached-password";
import {
  PASSWORD_BREACHED,
  PASSWORD_BREACHED_MESSAGE,
} from "@/lib/auth/password-policy";
import { recordSecurityEvent } from "@/lib/security-events/record-security-event";

// One container today, so an in-process set is enough to serialise the claim per user.
const claiming = new Set<string>();

// In session.create.before, so a refusal leaves no session row or cookie to clean up.
export async function refuseBreachedSignIn(
  userId: string,
  ctx: GenericEndpointContext | null,
  resetTtlSeconds: number,
) {
  if (ctx?.path !== "/sign-in/email") return;

  const password: unknown = ctx.body?.password;
  if (typeof password !== "string") return;

  if ((await checkBreached(password, SIGN_IN_TIMEOUT_MS)) !== "breached")
    return;

  // Claimed before any await, so overlapping attempts cannot both pass (identifier is not unique).
  if (!claiming.has(userId)) {
    claiming.add(userId);
    try {
      await sendRecoveryLinkOncePerWindow(userId, ctx, resetTtlSeconds);
    } finally {
      claiming.delete(userId);
    }
  }

  // Here, not in hooks.after: only this hook knows whose correct password was refused.
  await recordSecurityEvent("authn_login_blocked_breached", {
    userId,
    headers: ctx.headers ?? ctx.request?.headers,
  });

  throw new APIError("FORBIDDEN", {
    code: PASSWORD_BREACHED,
    message: PASSWORD_BREACHED_MESSAGE,
  });
}

// One email per reset window: retries would otherwise mail the owner on every attempt.
async function sendRecoveryLinkOncePerWindow(
  userId: string,
  ctx: GenericEndpointContext,
  resetTtlSeconds: number,
) {
  const adapter = ctx.context.internalAdapter;
  const markerId = `breach-recovery:${userId}`;

  const marker = await adapter.findVerificationValue(markerId);
  if (marker && marker.expiresAt > new Date()) return;

  const user = await adapter.findUserById(userId);
  if (!user) return;

  const expiresAt = new Date(Date.now() + resetTtlSeconds * 1000);
  const token = randomBytes(32).toString("base64url");

  await adapter.createVerificationValue({
    identifier: markerId,
    value: userId,
    expiresAt,
  });

  // Awaited since the password is proven, so timing leaks nothing and a failure can release the claim.
  try {
    // Same row shape requestPasswordReset writes, so the stock /reset-password consumes it.
    await adapter.createVerificationValue({
      identifier: `reset-password:${token}`,
      value: userId,
      expiresAt,
    });

    const callbackURL = encodeURIComponent(
      `${appUrl()}${localePath(userLocale(user), "/reset-password")}`,
    );
    const url = `${ctx.context.baseURL}/reset-password/${token}?callbackURL=${callbackURL}`;

    await emailService.sendBreachedPassword({
      to: user.email,
      locale: userLocale(user),
      url,
      token,
    });
  } catch (error) {
    logEmailFailure("breached-password")(error);
    await adapter.deleteVerificationByIdentifier(markerId);
  }
}
