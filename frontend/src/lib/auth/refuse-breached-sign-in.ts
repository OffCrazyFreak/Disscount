import "server-only";

import { randomBytes } from "node:crypto";
import { APIError } from "better-auth/api";
import type { GenericEndpointContext } from "better-auth";

import { appUrl } from "@/lib/env";
import { emailService } from "@/lib/email";
import { logEmailFailure } from "@/lib/auth/callbacks";
import {
  SIGN_IN_TIMEOUT_MS,
  checkBreached,
} from "@/lib/auth/breached-password";
import {
  PASSWORD_BREACHED,
  PASSWORD_BREACHED_MESSAGE,
} from "@/lib/auth/password-policy";

// Runs in session.create.before: after the password and email-verified checks pass,
// before any session row or cookie exists, so a refusal leaves nothing to clean up.
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

  const adapter = ctx.context.internalAdapter;

  // One email per reset window: retries would otherwise mail the owner on every attempt.
  const marker = await adapter.findVerificationValue(
    `breach-recovery:${userId}`,
  );
  const inFlight = !!marker && marker.expiresAt > new Date();

  if (!inFlight) {
    const user = await adapter.findUserById(userId);
    const expiresAt = new Date(Date.now() + resetTtlSeconds * 1000);
    const token = randomBytes(32).toString("base64url");

    // Same row shape requestPasswordReset writes, so the stock /reset-password consumes it.
    await adapter.createVerificationValue({
      identifier: `reset-password:${token}`,
      value: userId,
      expiresAt,
    });

    const callbackURL = encodeURIComponent(`${appUrl()}/reset-password`);
    const url = `${ctx.context.baseURL}/reset-password/${token}?callbackURL=${callbackURL}`;

    // Awaited, unlike the other sends: the caller already proved the password, so timing
    // leaks nothing, and a failed send must not write the marker that blocks a retry.
    const sent = user
      ? await emailService
          .sendBreachedPassword({ to: user.email, url, token })
          .then(() => true, logEmailFailure("breached-password"))
      : false;

    if (sent) {
      await adapter.createVerificationValue({
        identifier: `breach-recovery:${userId}`,
        value: userId,
        expiresAt,
      });
    }
  }

  throw new APIError("FORBIDDEN", {
    code: PASSWORD_BREACHED,
    message: PASSWORD_BREACHED_MESSAGE,
  });
}
