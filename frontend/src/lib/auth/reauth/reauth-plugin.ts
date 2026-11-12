import "server-only";

import { z } from "zod";
import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  sensitiveSessionMiddleware,
} from "better-auth/api";

import { REAUTH_CODE_LENGTH } from "@/constants/auth";
import { emailService } from "@/lib/email";
import { userLocale } from "@/lib/email/email-copy";
import { RecipientCapReachedError } from "@/lib/email/recipient-send-cap";
import { rotateSession } from "@/lib/auth/reauth/rotate-session";
import {
  consumeReauthCode,
  discardReauthCode,
  issueReauthCode,
} from "@/lib/auth/reauth/reauth-code";

const CREDENTIAL_PROVIDER = "credential";

const codeSchema = z.object({
  code: z.string().regex(new RegExp(`^\\d{${REAUTH_CODE_LENGTH}}$`)),
});

/** Under the auth base path so the rate limiter covers them; a proof rotates the session. */
export function reauth() {
  return {
    id: "reauth",
    endpoints: {
      reauthVerifyPassword: createAuthEndpoint(
        "/reauth/verify-password",
        {
          method: "POST",
          body: z.object({ password: z.string().min(1) }),
          use: [sensitiveSessionMiddleware],
        },
        async (ctx) => {
          const { user } = ctx.context.session;
          const accounts = await ctx.context.internalAdapter.findAccounts(
            user.id,
          );
          const hash = accounts.find(
            (account) => account.providerId === CREDENTIAL_PROVIDER,
          )?.password;

          const isValid =
            !!hash &&
            (await ctx.context.password.verify({
              hash,
              password: ctx.body.password,
            }));
          if (!isValid) {
            throw new APIError("BAD_REQUEST", {
              code: "INVALID_PASSWORD",
              message: "Invalid password",
            });
          }

          await rotateSession(ctx);
          return ctx.json({ status: true });
        },
      ),

      reauthSendCode: createAuthEndpoint(
        "/reauth/send-code",
        { method: "POST", use: [sensitiveSessionMiddleware] },
        async (ctx) => {
          const { user } = ctx.context.session;
          const accounts = await ctx.context.internalAdapter.findAccounts(
            user.id,
          );
          // A password is the stronger proof, so an account that has one never trades it for its inbox.
          if (accounts.some((a) => a.providerId === CREDENTIAL_PROVIDER)) {
            throw new APIError("BAD_REQUEST", {
              code: "USE_PASSWORD",
              message: "This account confirms with its password",
            });
          }

          const adapter = ctx.context.internalAdapter;
          const { code, codeId } = await issueReauthCode(
            adapter,
            ctx.context.secret,
            user.id,
          );

          try {
            await emailService.sendReauthCode({
              to: user.email,
              locale: userLocale(user),
              code,
              codeId,
            });
          } catch (error) {
            await discardReauthCode(adapter, user.id);
            if (error instanceof RecipientCapReachedError) {
              throw new APIError("TOO_MANY_REQUESTS", {
                code: "EMAIL_LIMIT",
                message: "Too many emails to this address, try again later",
              });
            }
            throw new APIError("INTERNAL_SERVER_ERROR", {
              code: "CODE_SEND_FAILED",
              message: "Failed to send the code",
            });
          }

          return ctx.json({ status: true });
        },
      ),

      reauthVerifyCode: createAuthEndpoint(
        "/reauth/verify-code",
        {
          method: "POST",
          body: codeSchema,
          use: [sensitiveSessionMiddleware],
        },
        async (ctx) => {
          await consumeReauthCode(
            ctx.context.internalAdapter,
            ctx.context.secret,
            ctx.context.session.user.id,
            ctx.body.code,
          );

          await rotateSession(ctx);
          return ctx.json({ status: true });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
