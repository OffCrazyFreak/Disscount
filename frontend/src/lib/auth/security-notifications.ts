import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { GenericEndpointContext } from "better-auth";

import { appUrl } from "@/lib/env";
import { emailService } from "@/lib/email";
import { userLocale } from "@/lib/email/email-copy";
import { localePath } from "@/i18n/locale-path";
import { logEmailFailure } from "@/lib/auth/callbacks";
import { readVerificationToken } from "@/lib/auth/verification-token";

interface INotifiedUser {
  email: string;
}

/** Fire-and-forget: the change already happened, so a failed notice must not undo it. */
export function notifyPasswordChanged(user: INotifiedUser) {
  const locale = userLocale(user);

  void emailService
    .sendPasswordChanged({
      to: user.email,
      locale,
      url: `${appUrl()}${localePath(locale, "/?modal=settings/sigurnost")}`,
      eventId: randomUUID(),
    })
    .catch(logEmailFailure("password-changed notice"));
}

/** The token of a confirmed email change, or null for any other user update. */
export function confirmedEmailChange(
  updatedUser: INotifiedUser,
  ctx: GenericEndpointContext | null | undefined,
) {
  const token: unknown = ctx?.query?.token;
  if (ctx?.path !== "/verify-email" || typeof token !== "string") return null;

  const claims = readVerificationToken(token);
  if (
    claims.requestType !== "change-email-verification" ||
    claims.updateTo !== updatedUser.email
  ) {
    return null;
  }

  return { token, claims };
}

/** A confirmed email change's token still names the old address, where the notice goes. */
export function notifyEmailChanged(
  updatedUser: INotifiedUser,
  ctx: GenericEndpointContext | null | undefined,
) {
  const change = confirmedEmailChange(updatedUser, ctx);
  if (!change) return;

  const { token, claims } = change;
  const locale = userLocale(updatedUser);
  void emailService
    .sendEmailChanged({
      to: claims.email,
      locale,
      url: `${appUrl()}${localePath(locale, "/?modal=contact")}`,
      // The link is single-purpose, so a reload of it maps to the same notice.
      eventId: createHash("sha256").update(token).digest("hex"),
      newEmail: updatedUser.email,
    })
    .catch(logEmailFailure("email-changed notice"));
}
