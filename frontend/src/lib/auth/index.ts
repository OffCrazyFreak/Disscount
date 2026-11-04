import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";

import { db } from "@/db";
import { createTranslator } from "next-intl";

import { z } from "zod";
import { LOCALES } from "@/i18n/locales";
import { loadMessages } from "@/i18n/load-messages";
import { appUrl } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";
import { emailService } from "@/lib/email";
import { userLocale } from "@/lib/email/email-copy";
import {
  dispatchResetPasswordEmail,
  dispatchVerificationEmail,
  hasLinkedSocialAccount,
  logEmailFailure,
  claimUnverifiedAccountOnReset,
} from "@/lib/auth/callbacks";
import { notifyExistingAccount } from "@/lib/auth/existing-account-notice";
import {
  BACKEND_TOKEN_TTL_MINUTES,
  FACEBOOK_COMING_SOON,
  RESET_TOKEN_TTL_SECONDS,
} from "@/constants/auth";
import { assertPasswordAcceptable } from "@/lib/auth/breached-password";
import { refuseBreachedSignIn } from "@/lib/auth/refuse-breached-sign-in";
import { recordLastLogin } from "@/lib/auth/record-last-login";
import {
  eraseBackendAccount,
  type SignJwt,
} from "@/lib/auth/erase-backend-account";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { CLIENT_IP_HEADER, trustedCountry } from "@/lib/client-ip/client-ip";
import { guardSensitiveAction } from "@/lib/auth/sensitive-action-guard";
import { reauth } from "@/lib/auth/reauth/reauth-plugin";
import {
  notifyEmailChanged,
  notifyPasswordChanged,
} from "@/lib/auth/security-notifications";

const BETTER_AUTH_URL = serverEnv.BETTER_AUTH_URL;
const BETTER_AUTH_SECRET = serverEnv.BETTER_AUTH_SECRET;
const GOOGLE_CLIENT_ID = serverEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = serverEnv.GOOGLE_CLIENT_SECRET;
const FACEBOOK_CLIENT_ID = serverEnv.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = serverEnv.FACEBOOK_CLIENT_SECRET;

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

// Guesses per client address; a correct proof lasts 15 minutes, so an honest person needs very few.
const PROOF_RATE_LIMIT = { window: 15 * 60, max: 5 };

// /set-password is server-only with no HTTP path, so its route calls assertPasswordAcceptable itself.
const NEW_PASSWORD_FIELDS: Record<string, string> = {
  "/sign-up/email": "password",
  "/reset-password": "newPassword",
  "/change-password": "newPassword",
};

// Signed with better-auth's own JWKS keys, which the backend already trusts.
const signAccountErasureToken: SignJwt = async (payload) => {
  const { token } = await auth.api.signJWT({ body: { payload } });
  return token;
};

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, { provider: "pg" }),

  advanced: {
    database: {
      generateId: "uuid",
    },
    // The auth route rewrites this header from the trusted proxy hop, so a forged value never reaches the limiter.
    ipAddress: {
      ipAddressHeaders: [CLIENT_IP_HEADER],
    },
  },

  // Stored in Postgres so counters survive a deploy and every route bundle shares them.
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/reauth/verify-password": PROOF_RATE_LIMIT,
      "/reauth/send-code": PROOF_RATE_LIMIT,
      "/reauth/verify-code": PROOF_RATE_LIMIT,
      // Carries the password or code itself, so it is a guessing surface too.
      "/delete-user": PROOF_RATE_LIMIT,
    },
  },

  session: {
    additionalFields: {
      // Set from the request at sign-in only, never from the client.
      country: { type: "string", required: false, input: false },
    },
    expiresIn: SESSION_TTL_SECONDS,
    // The window slides only when the session is used, and is rewritten at most once a day rather than on every request.
    updateAge: 60 * 60 * 24,
    // security-policy.ts owns freshness; better-auth's one day default would still fail a code-proven delete from an older session.
    freshAge: 0,
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    // Backstop only: better-auth counts UTF-16 units, our policy caps at 128 code points.
    maxPasswordLength: 512,
    // Gates credential login only; OAuth users take the provider's email_verified claim.
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }) => {
      await claimUnverifiedAccountOnReset(user);
      notifyPasswordChanged(user);
    },
    // Fire-and-forget like the sends below, so a registered address answers no slower.
    onExistingUserSignUp: async ({ user }) => {
      void notifyExistingAccount(user).catch(
        logEmailFailure("existing-account notice"),
      );
    },
    sendResetPassword: async ({ user, url, token }) => {
      // Fire-and-forget, so response time is no email-enumeration oracle.
      void dispatchResetPasswordEmail(
        user.id,
        user.email,
        url,
        token,
        userLocale(user),
      ).catch(logEmailFailure("password-reset"));
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    // Sent only after a correct password; the one-live-link rule keeps retries from mailing again.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      void dispatchVerificationEmail(
        user.id,
        user.email,
        url,
        token,
        userLocale(user),
      ).catch(logEmailFailure("verification"));
    },
  },

  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      // The server must refuse it too, because email-match linking is unsafe for Facebook until #43 is resolved.
      enabled: !FACEBOOK_COMING_SOON,
      clientId: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      // Email is required: a login returning none fails and surfaces to the user.
    },
  },

  account: {
    // Keyed by BETTER_AUTH_SECRET; rotating it needs `secrets` with the old one kept, see AUTH.md.
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      // Auto-links by shared email; a trusted provider skips the email_verified claim when linking, so Google stays untrusted.
      trustedProviders: FACEBOOK_COMING_SOON ? [] : ["facebook"],
    },
  },

  hooks: {
    // Must run before the handler, because /reset-password consumes its token before hashing, and a later refusal would burn the link.
    before: createAuthMiddleware(async (ctx) => {
      await guardSensitiveAction(ctx);

      const field = NEW_PASSWORD_FIELDS[ctx.path];
      const password: unknown = field ? ctx.body?.[field] : undefined;

      if (typeof password === "string")
        await assertPasswordAcceptable(password);
    }),
    after: createAuthMiddleware(async (ctx) => {
      const returned = ctx.context.returned;
      if (
        ctx.path === "/change-password" &&
        !isAPIError(returned) &&
        returned &&
        typeof returned === "object" &&
        "user" in returned
      ) {
        notifyPasswordChanged(returned.user as { email: string });
      }
    }),
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          await refuseBreachedSignIn(
            session.userId,
            ctx,
            RESET_TOKEN_TTL_SECONDS,
          );

          const country = trustedCountry(ctx?.headers ?? ctx?.request?.headers);
          return { data: { ...session, country } };
        },
        after: recordLastLogin,
      },
    },
    user: {
      update: {
        // Re-checks at apply time, closing the link-during-confirmation race the request-time guard leaves open.
        before: async (userData, ctx) => {
          const changingEmail = typeof userData.email === "string";
          const userId = ctx?.context.session?.user.id;

          if (
            changingEmail &&
            userId &&
            (await hasLinkedSocialAccount(userId))
          ) {
            const locale = userLocale(ctx?.context.session?.user);
            const t = createTranslator({
              locale,
              messages: await loadMessages(locale),
              namespace: "errors",
            });

            throw new APIError("BAD_REQUEST", {
              message: t("auth.changeEmailLinkedAccounts"),
            });
          }

          return { data: userData };
        },
        after: async (updatedUser, ctx) => {
          notifyEmailChanged(updatedUser, ctx);
        },
      },
    },
  },

  user: {
    additionalFields: {
      // Written by the client (input: true), so the validator rejects anything outside the five locales.
      locale: {
        type: "string",
        required: false,
        input: true,
        validator: { input: z.enum(LOCALES) },
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: (deletedUser) =>
        eraseBackendAccount(deletedUser.id, signAccountErasureToken),
    },
    changeEmail: {
      enabled: true,
      // Sent to the CURRENT address to approve the change before it applies.
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        void emailService
          .sendChangeEmailConfirmation({
            to: user.email,
            locale: userLocale(user),
            url,
            token,
            newEmail,
          })
          .catch(logEmailFailure("change-email confirmation"));
      },
    },
  },

  plugins: [
    jwt({
      // Only the backend proxy needs a token, and it asks for one; this would sign one into every session poll.
      disableSettingJwtHeader: true,
      jwks: {
        keyPairConfig: { alg: "ES256" },
      },
      jwt: {
        // Spring never asks whether the session still exists, so a revoked one keeps working until exp.
        expirationTime: `${BACKEND_TOKEN_TTL_MINUTES}m`,
        definePayload: ({ user }) => ({
          email: user.email,
          name: user.name,
          image: user.image,
        }),
      },
    }),
    reauth(),
    nextCookies(), // must be last
  ],

  trustedOrigins: [appUrl()],
});
