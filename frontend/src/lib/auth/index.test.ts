import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/erase-backend-account", () => ({
  eraseBackendAccount: vi.fn(),
}));

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
const { recordLastLogin } = await import("@/lib/auth/record-last-login");
const { eraseBackendAccount } =
  await import("@/lib/auth/erase-backend-account");

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

// better-auth deletes session rows on sign-out and expiry, so last login lives on the user row.
describe("last login", () => {
  it("is recorded whenever a session is created", () => {
    expect(auth.options.databaseHooks?.session?.create?.after).toBe(
      recordLastLogin,
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
