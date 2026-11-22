import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JwtOptions } from "better-auth/plugins";

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

// Only the backend proxy may hold a backend token; the browser never sees one.
describe("browser token endpoint", () => {
  it.each(["/api/auth/token", "/api/auth/token/"])(
    "answers 404 on %s",
    async (path) => {
      const response = await auth.handler(
        new Request(`http://localhost:3000${path}`),
      );

      expect(response.status).toBe(404);
    },
  );

  it("still mints for server code that calls auth.api directly", async () => {
    await expect(
      auth.api.getToken({ headers: new Headers() }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("signing key reads", () => {
  type IJwtAdapter = NonNullable<JwtOptions["adapter"]>;
  type IKeyContext = Parameters<NonNullable<IJwtAdapter["getJwks"]>>[0];

  const jwtPlugin = auth.options.plugins.find((plugin) => plugin.id === "jwt");
  const store = (jwtPlugin?.options as JwtOptions)
    .adapter as Required<IJwtAdapter>;

  const key = {
    id: "key-1",
    publicKey: "{}",
    privateKey: "{}",
    createdAt: new Date(),
  };

  function keyContext(path: string) {
    const findMany = vi.fn().mockResolvedValue([key]);
    const create = vi.fn().mockResolvedValue(key);
    const ctx = {
      path,
      context: { adapter: { findMany, create } },
    } as unknown as IKeyContext;

    return { ctx, findMany, create };
  }

  // Creating a key empties the in-process cache, so each test starts cold.
  beforeEach(async () => {
    await store.createJwk(key, keyContext("/token").ctx);
  });

  it("reads the key list once across repeated token mints", async () => {
    const { ctx, findMany } = keyContext("/token");

    await store.getJwks(ctx);
    await store.getJwks(ctx);

    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("reads the table again after a new key is created", async () => {
    const { ctx, findMany } = keyContext("/token");

    await store.getJwks(ctx);
    await store.createJwk(key, ctx);
    await store.getJwks(ctx);

    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it("always reads the table for the key list Spring fetches", async () => {
    const { ctx: mint } = keyContext("/token");
    const { ctx, findMany } = keyContext("/jwks");

    await store.getJwks(mint);
    await store.getJwks(ctx);
    await store.getJwks(ctx);

    expect(findMany).toHaveBeenCalledTimes(2);
  });
});

// Runs the real plugin over a stubbed table, so a mismatch between our key adapter and the plugin shows up.
describe("signing through the jwt plugin", () => {
  it("signs with a key that the published key list contains", async () => {
    const context = await auth.$context;
    const rows: Record<string, unknown>[] = [];

    // Creating a key empties the in-process cache the tests above filled with a fake key.
    const store = (
      auth.options.plugins.find((plugin) => plugin.id === "jwt")
        ?.options as JwtOptions
    ).adapter as Required<NonNullable<JwtOptions["adapter"]>>;

    await store.createJwk(
      { publicKey: "{}", privateKey: "{}", createdAt: new Date() },
      {
        path: "/token",
        context: { adapter: { create: vi.fn().mockResolvedValue({}) } },
      } as unknown as Parameters<typeof store.createJwk>[1],
    );

    vi.spyOn(context.adapter, "findMany").mockImplementation(async () =>
      structuredClone(rows),
    );
    vi.spyOn(context.adapter, "create").mockImplementation(async ({ data }) => {
      const row = { ...data, id: `key-${rows.length + 1}` };

      rows.push(row);

      return structuredClone(row);
    });

    const { token } = await auth.api.signJWT({
      body: { payload: { sub: "user-1" } },
    });
    const { keys } = await auth.api.getJwks();

    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString(),
    ) as { kid: string };

    expect(rows).toHaveLength(1);
    expect(keys.map((published) => published.kid)).toContain(header.kid);
  });
});
