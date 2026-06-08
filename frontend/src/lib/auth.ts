import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // TODO: implement sendResetPassword via Resend for forgot-password flow
  },

  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        }),
      },
    }),
    nextCookies(), // must be last
  ],

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});
