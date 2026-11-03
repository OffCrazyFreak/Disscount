import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getToken: mocks.getToken } } }));
vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

const { proxyToBackend } = await import("@/lib/backend-proxy/proxy-to-backend");
const { APP, backend, call, signedToken, signTokensFromCookie } =
  await import("@/test/proxy-call");

signTokensFromCookie(mocks.getToken);

describe("backend proxy path guard", () => {
  // Segments as Next hands them over, already decoded; a URL would resolve the dots first.
  it.each([
    ["an unknown root", ["internal", "actuator"]],
    ["no segment after /api", []],
    ["an empty segment", ["users", "", "me"]],
    ["a dot segment", ["users", "..", "admin"]],
    ["a decoded slash", ["users", "me/../../admin"]],
    ["a decoded backslash", ["users", "me\\admin"]],
  ])("refuses %s without calling Spring", async (_, segments) => {
    const response = await proxyToBackend(
      new Request(`${APP}/api/x`, {
        headers: { "X-Disscount-Client": "web" },
      }),
      segments,
    );

    expect(response.status).toBe(404);
  });
});

describe("backend proxy CSRF check", () => {
  it.each(["GET", "POST", "DELETE"])(
    "refuses a %s without the client header",
    async (method) => {
      const response = await call("/api/users/me", {
        method,
        headers: { "X-Disscount-Client": "" },
      });

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ code: "csrf_rejected" });
    },
  );

  it.each(["same-site", "cross-site", "none"])(
    "refuses a request whose Sec-Fetch-Site is %s",
    async (site) => {
      const response = await call("/api/users/me", {
        headers: { "Sec-Fetch-Site": site },
      });

      expect(response.status).toBe(403);
    },
  );

  it("refuses a write from another origin", async () => {
    const response = await call("/api/contact", {
      method: "POST",
      headers: { Origin: "https://evil.disscount.me" },
      body: "{}",
    });

    expect(response.status).toBe(403);
  });

  it("forwards a write from the app's own origin", async () => {
    const received = backend();

    const response = await call("/api/contact", {
      method: "POST",
      headers: { Origin: APP },
      body: "{}",
    });

    expect(response.status).toBe(200);
    expect(received).toHaveLength(1);
  });
});

describe("backend proxy identity pin", () => {
  it("forwards as the session's account with a token minted for it", async () => {
    const received = backend();

    await call("/api/users/me", { pin: "user-a", session: "user-a" });

    expect(received[0].headers.get("authorization")).toBe(
      `Bearer ${signedToken("user-a")}`,
    );
  });

  it("refuses a pin naming another account than the cookie, forwarding nothing", async () => {
    const response = await call("/api/users/me", {
      pin: "user-a",
      session: "user-b",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "session_changed" });
  });

  it("refuses an anonymous tab once the cookie names an account", async () => {
    const response = await call("/api/users/me", { session: "user-a" });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "session_changed" });
  });

  it("forwards an anonymous tab with no session and no token", async () => {
    const received = backend();

    await call("/api/shopping-lists/list-1");

    expect(received[0].headers.has("authorization")).toBe(false);
  });

  it("forwards anonymously when the pinned account's session has ended", async () => {
    const received = backend();

    const response = await call("/api/shopping-lists/list-1", {
      pin: "user-a",
    });

    expect(response.status).toBe(200);
    expect(received[0].headers.has("authorization")).toBe(false);
  });
});
