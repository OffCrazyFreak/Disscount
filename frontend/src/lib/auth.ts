import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";
import { requireEnv } from "@/lib/env";
import { emailService } from "@/lib/email";

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");
const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");
const GOOGLE_CLIENT_ID = requireEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = requireEnv("GOOGLE_CLIENT_SECRET");
const FACEBOOK_CLIENT_ID = requireEnv("FACEBOOK_CLIENT_ID");
const FACEBOOK_CLIENT_SECRET = requireEnv("FACEBOOK_CLIENT_SECRET");

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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Don't await — keeps response timing constant (no email-exists oracle).
      void emailService.sendPasswordReset({ to: user.email, url, token });
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
      // Auto-link providers sharing an email. Both flags are needed: trustedProviders trusts
      // the incoming provider, and requireLocalEmailVerified:false lets linking proceed even
      // when the existing account is unverified (Facebook returns email_verified=false).
      trustedProviders: ["google", "facebook"],
      requireLocalEmailVerified: false,
    },
  },

  user: {
    deleteUser: { enabled: true },
    changeEmail: {
      enabled: true,
      // Sent to the current address to approve the change before it applies.
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        void emailService.sendChangeEmailVerification({
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
