import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw-server";

vi.mock("server-only", () => ({}));

const { tables } = vi.hoisted(() => ({
  tables: {} as Record<string, Record<string, unknown>[]>,
}));

// The OAuth callback needs somewhere to keep state and users; Postgres is not available here.
vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory");
  return { drizzleAdapter: () => memoryAdapter(tables) };
});

vi.mock("@/lib/email", () => ({
  emailService: { sendVerificationEmail: vi.fn(async () => ({ ok: true })) },
}));

vi.stubEnv("DATABASE_URL", "postgres://test:test@localhost:5432/test");
vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-at-least-32-characters");
vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "google-id");
vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-secret");
vi.stubEnv("FACEBOOK_CLIENT_ID", "facebook-id");
vi.stubEnv("FACEBOOK_CLIENT_SECRET", "facebook-secret");
vi.stubEnv("RESEND_API_KEY", "re_test");
vi.stubEnv("EMAIL_FROM", "test@example.com");

const { auth } = await import("@/lib/auth");

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

// better-auth decodes the callback's id token without checking its signature,
// since it came straight from Google's token endpoint.
function googleIdToken(emailVerified: boolean) {
  const claims = {
    iss: "https://accounts.google.com",
    aud: "google-id",
    sub: "google-user-1",
    email: "person@example.com",
    email_verified: emailVerified,
    name: "Person",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return `${base64Url({ alg: "RS256", typ: "JWT" })}.${base64Url(claims)}.signature`;
}

async function signInWithGoogle(emailVerified: boolean) {
  server.use(
    http.post("https://oauth2.googleapis.com/token", () =>
      HttpResponse.json({
        access_token: "access-token",
        id_token: googleIdToken(emailVerified),
        token_type: "Bearer",
        expires_in: 3600,
      }),
    ),
  );

  const { headers, response } = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: "/" },
    returnHeaders: true,
  });
  const state = new URL(response.url ?? "").searchParams.get("state");
  const cookie = headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(";")[0])
    .join("; ");

  const callback = await auth.handler(
    new Request(
      `http://localhost:3000/api/auth/callback/google?code=code&state=${state}`,
      { headers: { cookie } },
    ),
  );

  return {
    user: tables.user.find((user) => user.email === "person@example.com"),
    redirect: callback.headers.get("location") ?? "",
  };
}

describe("Google sign-up email verification", () => {
  beforeEach(() => {
    for (const model of ["user", "account", "session", "verification", "jwks"])
      tables[model] = [];
  });

  it("keeps the email unverified when Google has not verified it", async () => {
    const { user } = await signInWithGoogle(false);

    expect(user).toMatchObject({ emailVerified: false });
  });

  it("marks the email verified when Google has verified it", async () => {
    const { user } = await signInWithGoogle(true);

    expect(user).toMatchObject({ emailVerified: true });
  });
});

describe("Google sign-in linking into an existing account", () => {
  beforeEach(() => {
    for (const model of ["user", "account", "session", "verification", "jwks"])
      tables[model] = [];

    tables.user.push({
      id: "existing-user",
      email: "person@example.com",
      emailVerified: true,
      name: "Existing",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  function googleAccounts() {
    return tables.account.filter((account) => account.providerId === "google");
  }

  it("refuses to link when Google has not verified the email", async () => {
    const { redirect } = await signInWithGoogle(false);

    expect(redirect).toContain("error=account_not_linked");
    expect(googleAccounts()).toEqual([]);
  });

  it("links when Google has verified the email", async () => {
    await signInWithGoogle(true);

    expect(googleAccounts()).toMatchObject([{ userId: "existing-user" }]);
  });
});
