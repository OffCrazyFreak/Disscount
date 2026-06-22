import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { account } from "../db/auth-schema";
import { requireEnv } from "@/lib/env";
import { emailService } from "@/lib/email";

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");
const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");
const GOOGLE_CLIENT_ID = requireEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = requireEnv("GOOGLE_CLIENT_SECRET");
const FACEBOOK_CLIENT_ID = requireEnv("FACEBOOK_CLIENT_ID");
const FACEBOOK_CLIENT_SECRET = requireEnv("FACEBOOK_CLIENT_SECRET");

const RESET_TOKEN_TTL_SECONDS = 60 * 30; // 30 minutes

// The reset flow is reused for two cases that read very differently to the user:
//   - an OAuth-only account adding a password for the first time  -> "set your password"
//   - an account that already has a password resetting it          -> "reset your password"
// We pick the wording by checking whether a credential account already exists, so the same
// secure token mechanism serves both the forgot-password and register-existing-email flows.
async function dispatchResetPasswordEmail(
  userId: string,
  email: string,
  url: string,
  token: string,
) {
  const credential = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);

  if (credential.length > 0) {
    await emailService.sendPasswordReset({ to: email, url, token });
  } else {
    await emailService.sendSetPassword({ to: email, url, token });
  }
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
      // (no enumeration oracle). The DB lookup runs inside the un-awaited task.
      void dispatchResetPasswordEmail(user.id, user.email, url, token);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      void emailService.sendVerificationEmail({ to: user.email, url, token });
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
    user: {
      create: {
        // OAuth providers (Google, Facebook) are trusted to own the email, so mark it verified
        // on creation. This keeps requireEmailVerification's gate intact for email/password
        // sign-ups (which must verify) while letting social accounts auto-link and auto-login.
        // Facebook is the key case: it returns no email-verified claim, so without this it would
        // be stored unverified and block linking.
        before: async (user, ctx) => {
          const isEmailSignup = ctx?.path === "/sign-up/email";

          if (!isEmailSignup) {
            return { data: { ...user, emailVerified: true } };
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
        void emailService.sendChangeEmailConfirmation({
          to: user.email,
          url,
          token,
          newEmail,
        });
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
