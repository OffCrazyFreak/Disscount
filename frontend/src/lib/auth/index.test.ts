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

// The catch-all exposes these endpoints, so the policy sits in hooks.before.
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
