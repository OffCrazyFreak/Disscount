import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";

import { db } from "@/db";
import { createTranslator } from "next-intl";

import { isLocale } from "@/i18n/locales";
import { loadMessages } from "@/i18n/load-messages";
import { appUrl, requireEnv } from "@/lib/env";
import { emailService } from "@/lib/email";
import { userLocale } from "@/lib/email/email-copy";
import {
  dispatchResetPasswordEmail,
  hasLinkedSocialAccount,
  logEmailFailure,
} from "@/lib/auth/callbacks";

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");
const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");
const GOOGLE_CLIENT_ID = requireEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = requireEnv("GOOGLE_CLIENT_SECRET");
const FACEBOOK_CLIENT_ID = requireEnv("FACEBOOK_CLIENT_ID");
const FACEBOOK_CLIENT_SECRET = requireEnv("FACEBOOK_CLIENT_SECRET");

const RESET_TOKEN_TTL_SECONDS = 60 * 30; // 30 minutes
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// input: true lets the client write the field, so anything outside the five
// locales is dropped rather than stored.
function withValidLocale<T extends Record<string, unknown>>(userData: T): T {
  if (!("locale" in userData) || isLocale(userData.locale)) return userData;
  const { locale: _invalid, ...rest } = userData;
  return rest as T;
}

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
    minPasswordLength: 12,
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

  databaseHooks: {
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
      create: {
        before: async (userData) => ({ data: withValidLocale(userData) }),
      },
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

          return { data: withValidLocale(userData) };
        },
      },
    },
  },

  user: {
    additionalFields: {
      // Set from the signup form and the language switcher; drives email language.
      locale: { type: "string", required: false, input: true },
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
