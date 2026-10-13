import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { db } from "@/db";
import { createTranslator } from "next-intl";

import { z } from "zod";
import { LOCALES } from "@/i18n/locales";
import { loadMessages } from "@/i18n/load-messages";
import { appUrl, requireEnv } from "@/lib/env";
import { emailService } from "@/lib/email";
import { userLocale } from "@/lib/email/email-copy";
import {
  dispatchResetPasswordEmail,
  hasLinkedSocialAccount,
  logEmailFailure,
} from "@/lib/auth/callbacks";
import { RESET_TOKEN_TTL_SECONDS } from "@/constants/auth";
import { assertPasswordAcceptable } from "@/lib/auth/breached-password";
import { refuseBreachedSignIn } from "@/lib/auth/refuse-breached-sign-in";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");
const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");
const GOOGLE_CLIENT_ID = requireEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = requireEnv("GOOGLE_CLIENT_SECRET");
const FACEBOOK_CLIENT_ID = requireEnv("FACEBOOK_CLIENT_ID");
const FACEBOOK_CLIENT_SECRET = requireEnv("FACEBOOK_CLIENT_SECRET");

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Endpoints that set a password, and the body field carrying it. /set-password is
// server-only with no HTTP path, so its route calls assertPasswordAcceptable itself.
const NEW_PASSWORD_FIELDS: Record<string, string> = {
  "/sign-up/email": "password",
  "/reset-password": "newPassword",
  "/change-password": "newPassword",
};

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, { provider: "pg" }),

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  session: {
    expiresIn: SESSION_TTL_SECONDS,
    // Default, set explicitly: the window slides only when the session is used,
    // and is rewritten at most once a day rather than on every request.
    updateAge: 60 * 60 * 24,
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    // Backstop only: better-auth counts UTF-16 units, our policy caps at 128 code points.
    maxPasswordLength: 512,
    // Gates credential login only; OAuth emails are verified on creation below.
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
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
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      void emailService
        .sendVerificationEmail({
          to: user.email,
          locale: userLocale(user),
          url,
          token,
        })
        .catch(logEmailFailure("verification"));
    },
  },

  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      // Defaults to scopes ["email", "public_profile"] plus the "picture" field.
      // Email is required: a login returning none fails and surfaces to the user.
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Auto-links by shared email; the gate requires the EXISTING account verified,
      // satisfied by marking OAuth emails verified below rather than the deprecated
      // requireLocalEmailVerified flag.
      trustedProviders: ["google", "facebook"],
    },
  },

  hooks: {
    // Must run before the handler: /reset-password consumes its token before hashing,
    // so a later refusal would burn the link.
    before: createAuthMiddleware(async (ctx) => {
      const field = NEW_PASSWORD_FIELDS[ctx.path];
      const password: unknown = field ? ctx.body?.[field] : undefined;

      if (typeof password === "string")
        await assertPasswordAcceptable(password);
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
        },
      },
    },
    account: {
      create: {
        // The provider owns the email, so verify it on OAuth account creation. Checking
        // providerId here (not the request path) can't accidentally verify a credential signup.
        after: async (createdAccount, ctx) => {
          if (!ctx || createdAccount.providerId === "credential") return;

          await ctx.context.internalAdapter.updateUser(createdAccount.userId, {
            emailVerified: true,
          });
        },
      },
    },
    user: {
      update: {
        // Re-checks at apply time (the /api/account/change-email POST guard only checks
        // at request time), closing the link-during-confirmation race.
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
      },
    },
  },

  user: {
    additionalFields: {
      // Written by the client (input: true), so the validator rejects anything
      // outside the five locales before it reaches the database.
      locale: {
        type: "string",
        required: false,
        input: true,
        validator: { input: z.enum(LOCALES) },
      },
    },
    deleteUser: { enabled: true },
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
      jwks: {
        keyPairConfig: { alg: "ES256" },
      },
      jwt: {
        definePayload: ({ user }) => ({
          email: user.email,
          name: user.name,
          image: user.image,
        }),
      },
    }),
    nextCookies(), // must be last
  ],

  trustedOrigins: [appUrl()],
});
