import { beforeEach, describe, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { createAuthMiddleware } from "better-auth/api";

vi.mock("server-only", () => ({}));

const erasedIds = new Set<string>();
vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks: unknown[] }) => {
      const id = query.queryChunks.find((chunk) => typeof chunk === "string");
      return { rows: erasedIds.has(id as string) ? [{ "?column?": 1 }] : [] };
    }),
  },
}));

const sentCodes: string[] = [];
vi.mock("@/lib/email", () => ({
  emailService: {
    sendReauthCode: vi.fn(async ({ code }: { code: string }) => {
      sentCodes.push(code);
    }),
  },
}));

const { guardSensitiveAction } =
  await import("@/lib/auth/sensitive-action-guard");
const { reauth } = await import("@/lib/auth/reauth/reauth-plugin");

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {
  user: [],
  session: [],
  account: [],
  verification: [],
};

const auth = betterAuth({
  baseURL: "http://localhost:3000",
  secret: "test-secret-that-is-at-least-32-characters",
  database: memoryAdapter(tables),
  emailAndPassword: { enabled: true },
  user: { deleteUser: { enabled: true } },
  // Same as the app: the rule table, not better-auth's one day default, owns freshness.
  session: { freshAge: 0 },
  hooks: {
    before: createAuthMiddleware(async (ctx) => guardSensitiveAction(ctx)),
  },
  plugins: [reauth()],
});

const PASSWORD = "correct horse battery staple";
const SIXTEEN_MINUTES_MS = 16 * 60 * 1000;
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function cookieFrom(headers: Headers) {
  const token = headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("better-auth.session_token="));
  return new Headers({ cookie: token!.split(";")[0] });
}

async function signUp(email: string) {
  const { headers, response } = await auth.api.signUpEmail({
    body: { email, password: PASSWORD, name: "Test" },
    returnHeaders: true,
  });
  return { headers: cookieFrom(headers), userId: response.user.id };
}

function ageSessions(userId: string, ageMs = SIXTEEN_MINUTES_MS) {
  for (const row of tables.session.filter((s) => s.userId === userId)) {
    row.createdAt = new Date(Date.now() - ageMs);
  }
}

function dropPassword(userId: string) {
  tables.account = tables.account.filter(
    (row) => !(row.userId === userId && row.providerId === "credential"),
  );
}

beforeEach(() => {
  for (const key of Object.keys(tables)) tables[key] = [];
  erasedIds.clear();
  sentCodes.length = 0;
});

describe("sensitive action guard", () => {
  it("runs for in-process auth.api calls, not just HTTP", async () => {
    const { headers, userId } = await signUp("stale@example.com");
    ageSessions(userId);

    await expect(
      auth.api.unlinkAccount({
        body: { accountId: "google-account" },
        headers,
      }),
    ).rejects.toMatchObject({ body: { code: "REAUTH_REQUIRED" } });
  });

  it("lets a fresh session past the rule", async () => {
    const { headers } = await signUp("fresh@example.com");

    await expect(
      auth.api.unlinkAccount({
        body: { accountId: "google-account" },
        headers,
      }),
    ).rejects.not.toMatchObject({ body: { code: "REAUTH_REQUIRED" } });
  });

  // The settings screen unlinks by the id listAccounts returns, which better-auth 1.7 matches
  // against the account row, not the provider's own account id.
  it("unlinks a social account by the id the account list returns", async () => {
    const { headers, userId } = await signUp("unlink@example.com");
    tables.account.push({
      id: "google-row",
      accountId: "google-subject",
      providerId: "google",
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const accounts = await auth.api.listUserAccounts({ headers });
    const google = accounts.find((row) => row.providerId === "google");

    await expect(
      auth.api.unlinkAccount({ body: { accountId: google!.id }, headers }),
    ).resolves.toEqual({ status: true });
    expect(tables.account.some((row) => row.id === "google-row")).toBe(false);
  });

  it("asks for proof on delete even inside the window", async () => {
    const { headers } = await signUp("delete@example.com");

    await expect(
      auth.api.deleteUser({ body: {}, headers }),
    ).rejects.toMatchObject({ body: { code: "REAUTH_REQUIRED" } });
  });

  it("deletes with the password in the same request", async () => {
    const { headers, userId } = await signUp("withpassword@example.com");
    ageSessions(userId);

    await auth.api.deleteUser({ body: { password: PASSWORD }, headers });

    expect(tables.user.find((row) => row.id === userId)).toBeUndefined();
  });

  it("lets an erased account finish its deletion without a second proof", async () => {
    const { headers, userId } = await signUp("erased@example.com");
    erasedIds.add(userId);

    await auth.api.deleteUser({ body: {}, headers });

    expect(tables.user.find((row) => row.id === userId)).toBeUndefined();
  });

  it("refuses the token-leaking session list over HTTP", async () => {
    const { headers } = await signUp("list@example.com");

    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/list-sessions", { headers }),
    );

    expect(response.status).toBe(404);
  });
});

describe("reauth proofs", () => {
  it("rotates the session on a correct password", async () => {
    const { headers, userId } = await signUp("rotate@example.com");
    ageSessions(userId);
    const [oldSession] = tables.session;

    const result = await auth.api.reauthVerifyPassword({
      body: { password: PASSWORD },
      headers,
      returnHeaders: true,
    });

    const sessions = tables.session.filter((s) => s.userId === userId);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).not.toBe(oldSession.id);

    await expect(
      auth.api.unlinkAccount({
        body: { accountId: "google-account" },
        headers: cookieFrom(result.headers),
      }),
    ).rejects.not.toMatchObject({ body: { code: "REAUTH_REQUIRED" } });
  });

  it("keeps the session on a wrong password", async () => {
    const { headers } = await signUp("wrong@example.com");

    await expect(
      auth.api.reauthVerifyPassword({ body: { password: "nope" }, headers }),
    ).rejects.toMatchObject({ body: { code: "INVALID_PASSWORD" } });
    expect(tables.session).toHaveLength(1);
  });

  it("mails a code only to an account without a password", async () => {
    const { headers } = await signUp("haspassword@example.com");

    await expect(auth.api.reauthSendCode({ headers })).rejects.toMatchObject({
      body: { code: "USE_PASSWORD" },
    });
    expect(sentCodes).toHaveLength(0);
  });

  it("deletes a passwordless account with the emailed code", async () => {
    const { headers, userId } = await signUp("google-only@example.com");
    dropPassword(userId);

    await auth.api.reauthSendCode({ headers });
    await auth.api.deleteUser({
      body: { code: sentCodes[0] } as Record<string, string>,
      headers,
    });

    expect(tables.user.find((row) => row.id === userId)).toBeUndefined();
  });

  it("deletes with the code from a session signed in days ago", async () => {
    const { headers, userId } = await signUp("old-session@example.com");
    dropPassword(userId);
    ageSessions(userId, TWO_DAYS_MS);

    await auth.api.reauthSendCode({ headers });
    await auth.api.deleteUser({
      body: { code: sentCodes[0] } as Record<string, string>,
      headers,
    });

    expect(tables.user.find((row) => row.id === userId)).toBeUndefined();
  });

  it("counts wrong codes down and then burns the code", async () => {
    const { headers, userId } = await signUp("guess@example.com");
    dropPassword(userId);
    await auth.api.reauthSendCode({ headers });
    const wrong = sentCodes[0] === "000000" ? "111111" : "000000";

    for (const attemptsLeft of [2, 1]) {
      await expect(
        auth.api.reauthVerifyCode({ body: { code: wrong }, headers }),
      ).rejects.toMatchObject({ body: { code: "INVALID_CODE", attemptsLeft } });
    }
    await expect(
      auth.api.reauthVerifyCode({ body: { code: wrong }, headers }),
    ).rejects.toMatchObject({ body: { code: "CODE_EXPIRED" } });
    await expect(
      auth.api.reauthVerifyCode({ body: { code: sentCodes[0] }, headers }),
    ).rejects.toMatchObject({ body: { code: "CODE_EXPIRED" } });
  });

  it("waits a minute before mailing another code", async () => {
    const { headers, userId } = await signUp("resend@example.com");
    dropPassword(userId);
    await auth.api.reauthSendCode({ headers });

    await expect(auth.api.reauthSendCode({ headers })).rejects.toMatchObject({
      body: { code: "CODE_RESEND_TOO_SOON" },
    });
    expect(sentCodes).toHaveLength(1);
  });
});
