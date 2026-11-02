import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Module load requires these; pg's Pool only connects on the first query, so none runs.
vi.stubEnv("DATABASE_URL", "postgres://test:test@localhost:5432/test");
vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-at-least-32-characters");
vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "google-id");
vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-secret");
vi.stubEnv("FACEBOOK_CLIENT_ID", "facebook-id");
vi.stubEnv("FACEBOOK_CLIENT_SECRET", "facebook-secret");
vi.stubEnv("RESEND_API_KEY", "re_test");
vi.stubEnv("EMAIL_FROM", "test@example.com");

const { FACEBOOK_COMING_SOON } = await import("@/constants/auth");
const { auth } = await import("@/lib/auth");
const { CLIENT_IP_HEADER } = await import("@/lib/client-ip/client-ip");
const { recordLastLogin } = await import("@/lib/auth/record-last-login");

const expectedProviders = FACEBOOK_COMING_SOON
  ? ["google"]
  : ["google", "facebook"];

describe("Facebook behind FACEBOOK_COMING_SOON", () => {
  it("registers Facebook only once it is launched", async () => {
    const context = await auth.$context;

    expect(context.socialProviders.map((provider) => provider.id)).toEqual(
      expectedProviders,
    );
  });

  it("trusts Facebook for email-match linking only once it is launched", () => {
    expect(auth.options.account?.accountLinking?.trustedProviders).toEqual(
      FACEBOOK_COMING_SOON ? [] : ["facebook"],
    );
  });

  // Enabled, the call stores OAuth state in the database, which this test has none of.
  it.runIf(FACEBOOK_COMING_SOON)(
    "refuses a Facebook sign-in sent straight to the API",
    async () => {
      await expect(
        auth.api.signInSocial({
          body: { provider: "facebook", callbackURL: "/" },
        }),
      ).rejects.toMatchObject({ body: { code: "PROVIDER_NOT_FOUND" } });
    },
  );
});

describe("rate limiting", () => {
  it("is on in every environment and survives restarts", () => {
    expect(auth.options.rateLimit).toMatchObject({
      enabled: true,
      storage: "database",
    });
  });

  it("keys on the client address the auth route resolved", () => {
    expect(auth.options.advanced?.ipAddress?.ipAddressHeaders).toEqual([
      CLIENT_IP_HEADER,
    ]);
  });
});

// better-auth deletes session rows on sign-out and expiry, so last login lives on the user row.
describe("last login", () => {
  it("is recorded whenever a session is created", () => {
    expect(auth.options.databaseHooks?.session?.create?.after).toBe(
      recordLastLogin,
    );
  });
});

describe("register flow", () => {
  it("re-sends the verification link when an unverified owner signs in", () => {
    expect(auth.options.emailVerification?.sendOnSignIn).toBe(true);
  });

  it("answers a registered address like a new one and mails its owner", () => {
    expect(auth.options.emailAndPassword?.requireEmailVerification).toBe(true);
    expect(auth.options.emailAndPassword?.onExistingUserSignUp).toBeTypeOf(
      "function",
    );
  });

  it("signs every device out after a reset", () => {
    expect(auth.options.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(
      true,
    );
  });
});
