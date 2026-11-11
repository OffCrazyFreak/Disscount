import { HttpResponse, http } from "msw";
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

const { proxyDocsToBackend } =
  await import("@/lib/backend-proxy/proxy-to-backend");
const { APP, BACKEND } = await import("@/test/proxy-call");
const { server } = await import("@/test/msw-server");

function openInBrowser(path: string, headers: Record<string, string> = {}) {
  // A plain navigation: no client header, no identity pin, but the session cookie is there.
  const request = new Request(new URL(path, APP), {
    headers: { cookie: "session=user-a", ...headers },
  });
  const segments = new URL(path, APP).pathname.split("/").slice(2);
  return proxyDocsToBackend(request, segments);
}

function springServesDocs() {
  const received: Request[] = [];
  server.use(
    http.get(`${BACKEND}/api/*`, ({ request }) => {
      received.push(request.clone());
      return HttpResponse.json({ openapi: "3.1.0" });
    }),
  );
  return received;
}

describe("API docs proxy", () => {
  it("serves the description to a plain browser visit without the client header", async () => {
    const received = springServesDocs();

    const response = await openInBrowser("/api/v3/api-docs");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ openapi: "3.1.0" });
    expect(new URL(received[0].url).pathname).toBe("/api/v3/api-docs");
  });

  it("never sends the session, a token or the browser's own Authorization to Spring", async () => {
    const received = springServesDocs();

    await openInBrowser("/api/swagger-ui/index.html", {
      Authorization: "Bearer typed-into-swagger",
    });

    expect(received[0].headers.get("authorization")).toBeNull();
    expect(received[0].headers.get("cookie")).toBeNull();
    expect(mocks.getToken).not.toHaveBeenCalled();
  });

  it("refuses any path outside the docs without calling Spring", async () => {
    const received = springServesDocs();

    const response = await openInBrowser("/api/v3/users");

    expect(response.status).toBe(404);
    expect(received).toHaveLength(0);
  });
});
