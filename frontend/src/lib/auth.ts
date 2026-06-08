import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";

/**
 * better-auth is the identity provider for the app. It owns the auth tables in
 * Postgres (user / session / account / verification / jwks) via the Drizzle
 * adapter. The Spring backend trusts the JWTs minted here (validated against the
 * JWKS endpoint) and keeps the business profile in its own `app_user` table,
 * keyed by the same id.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Generate UUID primary keys so the existing `uuid` foreign keys in the
  // backend business tables (user_id, owner_id, ...) keep referencing the user.
  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Seam for Resend (forgot-password flow) — wire up later:
    // sendResetPassword: async ({ user, url }) => { /* send email via Resend */ },
  },

  user: {
    // Lets a user delete their identity here (frees the email for re-use). The
    // Spring backend separately anonymizes the profile but keeps the business
    // data. Requires a fresh session (default <= 1 day) or password.
    deleteUser: {
      enabled: true,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // better-auth refuses to auto-link via TWO checks:
      //  1) the incoming provider must be trusted OR verify the email,
      //  2) requireLocalEmailVerified (default TRUE) — the EXISTING account's
      //     email must be verified.
      // `trustedProviders` only satisfies (1). Our credential signups are
      // unverified (no email verification yet), so we must also relax (2).
      // NOTE: this is the pre-registration takeover tradeoff you accepted —
      // revisit once Resend / email verification is wired up.
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    // Facebook makes sense for this app — slot it in here later:
    // facebook: {
    //   clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID as string,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    // },
  },

  trustedOrigins: process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : [],

  plugins: [
    // Mint JWTs the Spring backend can verify via JWKS. ES256 keeps the keys
    // small and is natively supported by Spring Security / Nimbus.
    jwt({
      jwks: {
        keyPairConfig: { alg: "ES256" },
      },
      jwt: {
        // Include email + name so the backend can lazily provision the profile
        // row from the token claims on first authenticated request. `sub`
        // remains the user id (a UUID) by default.
        definePayload: ({ user }) => ({
          email: user.email,
          name: user.name,
        }),
      },
    }),

    // Must stay last so Set-Cookie headers are forwarded in server actions.
    nextCookies(),
  ],
});
