import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/erase-backend-account", () => ({
  eraseBackendAccount: vi.fn(),
}));
vi.mock("hibp", () => ({ pwnedPassword: vi.fn() }));

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
const { eraseBackendAccount } =
  await import("@/lib/auth/erase-backend-account");
const { pwnedPassword } = await import("hibp");

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

// beforeDelete runs after better-auth's own checks and before the identity goes.
describe("account deletion", () => {
  it("erases the backend data for the deleted user before the identity", async () => {
    const beforeDelete = auth.options.user?.deleteUser?.beforeDelete;
    const deletedUser = { id: "user-1" } as Parameters<
      NonNullable<typeof beforeDelete>
    >[0];

    await beforeDelete?.(deletedUser);

    expect(eraseBackendAccount).toHaveBeenCalledWith(
      "user-1",
      expect.any(Function),
    );
  });
});

// The sessions list shows a country instead of an IP, read once when the session is created.
describe("session country", () => {
  it("stores the country the trusted request carried", async () => {
    const before = auth.options.databaseHooks?.session?.create?.before;
    const created = { userId: "user-1", token: "t" } as Parameters<
      NonNullable<typeof before>
    >[0];
    const ctx = {
      path: "/sign-in/social",
      headers: new Headers({ "cf-ipcountry": "HR" }),
    } as unknown as Parameters<NonNullable<typeof before>>[1];

    await expect(before?.(created, ctx)).resolves.toEqual({
      data: { ...created, country: "HR" },
    });
  });
});

// The rule table guards every path that reads freshAge; the one day default would still
// refuse a code-proven delete from an older session.
describe("session freshness", () => {
  it("is owned by the re-auth rule table, not better-auth's default", () => {
    expect(auth.options.session?.freshAge).toBe(0);
  });
});

// better-auth 1.7.15 encrypts the access and refresh tokens only; the id token stays as issued.
describe("stored OAuth tokens", () => {
  it("are encrypted before they reach the account table", () => {
    expect(auth.options.account?.encryptOAuthTokens).toBe(true);
  });
});

// The catch-all auth route exposes these endpoints directly, so the policy has to sit in
// hooks.before, which wraps the same endpoint for HTTP and in-process calls. The test
// database is unreachable, so a call that got past the hook would fail with a query error.
describe("new password policy", () => {
  const BREACHED = "password1234";

  const passwordSetters = [
    {
      path: "/sign-up/email",
      call: (password: string) =>
        auth.api.signUpEmail({
          body: { email: "new@example.com", name: "new", password },
        }),
    },
    {
      path: "/reset-password",
      call: (newPassword: string) =>
        auth.api.resetPassword({ body: { token: "token", newPassword } }),
    },
    {
      path: "/change-password",
      call: (newPassword: string) =>
        auth.api.changePassword({
          body: { currentPassword: "current", newPassword },
          headers: new Headers(),
        }),
    },
  ];

  it.each(passwordSetters)(
    "refuses a breached password on $path",
    async ({ call }) => {
      vi.mocked(pwnedPassword).mockResolvedValue(3);

      await expect(call(BREACHED)).rejects.toMatchObject({
        body: { code: "PASSWORD_BREACHED" },
      });
    },
  );

  it.each(passwordSetters)(
    "refuses a short password on $path",
    async ({ call }) => {
      vi.mocked(pwnedPassword).mockResolvedValue(0);

      await expect(call("short")).rejects.toMatchObject({
        body: { code: "PASSWORD_LENGTH_INVALID" },
      });
    },
  );
});
