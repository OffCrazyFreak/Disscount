import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";

import { db } from "@/db";
import { requireEnv } from "@/lib/env";
import { emailService } from "@/lib/email";
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

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, { provider: "pg" }),

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    // Hard gate: email/password login is blocked until the address is verified. OAuth logins
    // are unaffected (their email is marked verified on creation, see databaseHooks below).
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Fire-and-forget so the response time is identical whether or not the email exists
      // (no enumeration oracle). The DB lookup runs inside the un-awaited task; .catch keeps a
      // failed send from becoming an unhandled rejection.
      void dispatchResetPasswordEmail(user.id, user.email, url, token).catch(
        logEmailFailure("password-reset"),
      );
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      void emailService
        .sendVerificationEmail({ to: user.email, url, token })
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
      // Defaults to scopes ["email", "public_profile"] and includes the "picture" field.
      // Email is required: a login that returns none fails and is surfaced to the user.
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Auto-link any of these providers that share an email into one account. The link gate
      // also requires the EXISTING local account to be verified; we satisfy that by marking
      // OAuth emails verified on creation (databaseHooks below) rather than the deprecated
      // requireLocalEmailVerified flag.
      trustedProviders: ["google", "facebook"],
    },
  },

  databaseHooks: {
    account: {
      create: {
        // Positive OAuth signal: when a social account is created (sign-up or linking), mark the
        // user's email verified - the provider owns the email. Credential accounts are skipped,
        // so email/password sign-ups keep requireEmailVerification's gate. Google already arrives
        // verified; this is what makes Facebook (which returns no verified claim) work without
        // the deprecated requireLocalEmailVerified flag, and it can't accidentally verify a
        // credential signup (unlike a path-based check).
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
        // Defense-in-depth for the single-email invariant. The /api/account/change-email POST
        // guard runs at request time; this re-checks when the change is actually applied (the
        // confirmation-link click is an update op whose ctx carries the session), closing the
        // race where a social account is linked between request and confirmation.
        before: async (userData, ctx) => {
          const changingEmail = typeof userData.email === "string";
          const userId = ctx?.context.session?.user.id;
          if (!changingEmail || !userId) return;

          if (await hasLinkedSocialAccount(userId)) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Za promjenu emaila prvo odspoji povezane račune (Google, Facebook).",
            });
          }
        },
      },
    },
  },

  user: {
    deleteUser: { enabled: true },
    changeEmail: {
      enabled: true,
      // Sent to the CURRENT address to approve the change before it applies.
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        void emailService
          .sendChangeEmailConfirmation({ to: user.email, url, token, newEmail })
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

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});
