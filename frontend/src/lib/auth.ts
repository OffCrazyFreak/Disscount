import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");
const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");
const GOOGLE_CLIENT_ID = requireEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = requireEnv("GOOGLE_CLIENT_SECRET");

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
    // TODO: implement sendResetPassword via Resend for forgot-password flow
  },

  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
    // TODO: add Facebook provider
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // TODO: remove requireLocalEmailVerified:false once Resend email verification is wired up
      // Both flags are required: trustedProviders clears the provider check, this clears the local-email check
      requireLocalEmailVerified: false,
    },
  },

  user: {
    deleteUser: { enabled: true },
    // Emails aren't verified yet, so a change applies immediately.
    // TODO: add sendChangeEmailVerification once Resend email verification is wired up
    changeEmail: { enabled: true },
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
