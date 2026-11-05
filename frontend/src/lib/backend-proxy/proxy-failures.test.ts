import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getToken: mocks.getToken } } }));
vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

const { BACKEND, call, signTokensFromCookie, signedToken } =
  await import("@/test/proxy-call");
const { server } = await import("@/test/msw-server");

afterEach(() => {
  signTokensFromCookie(mocks.getToken);
  mocks.captureException.mockClear();
});
signTokensFromCookie(mocks.getToken);

function sentryEvents() {
  return JSON.stringify(mocks.captureException.mock.calls);
}

describe("backend proxy failures", () => {
  it("answers 502 when Spring cannot be reached, reporting only the path root", async () => {
    server.use(http.get(`${BACKEND}/api/*`, () => HttpResponse.error()));

    const response = await call("/api/shopping-lists/list-1", {
      pin: "user-a",
      session: "user-a",
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      code: "backend_unavailable",
    });
    expect(mocks.captureException).toHaveBeenCalledWith(expect.anything(), {
      tags: expect.objectContaining({ pathRoot: "shopping-lists" }),
    });
    expect(sentryEvents()).not.toContain("Bearer");
    expect(sentryEvents()).not.toContain(signedToken("user-a"));
    expect(sentryEvents()).not.toContain("list-1");
  });

  it("answers 504 when Spring outlives the timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new DOMException("The operation timed out.", "TimeoutError"),
    );

    const response = await call("/api/products/catalog/eans");

    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ code: "backend_timeout" });
  });

  it("answers 503 when the session cannot be read, without calling Spring", async () => {
    mocks.getToken.mockRejectedValueOnce(new Error("connection refused"));

    const response = await call("/api/users/me", {
      pin: "user-a",
      session: "user-a",
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "auth_unavailable" });
    expect(sentryEvents()).not.toContain("session=user-a");
  });

  it("cancels the Spring call when the browser goes away, and reports nothing", async () => {
    const browser = new AbortController();
    let upstreamSignal: AbortSignal | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(
      (_, init) =>
        new Promise((_resolve, reject) => {
          upstreamSignal = init?.signal ?? undefined;
          upstreamSignal?.addEventListener("abort", () =>
            reject(upstreamSignal?.reason),
          );
          browser.abort();
        }),
    );

    const response = await call("/api/products/catalog/eans", {
      signal: browser.signal,
    });

    expect(upstreamSignal?.aborted).toBe(true);
    expect(response.status).toBe(499);
    expect(mocks.captureException).not.toHaveBeenCalled();
  });
});
