import { http, HttpResponse } from "msw";
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

const { BACKEND, backend, call, signTokensFromCookie } =
  await import("@/test/proxy-call");
const { server } = await import("@/test/msw-server");

signTokensFromCookie(mocks.getToken);

const VISITOR = "93.140.10.20";
const CLOUDFLARE_EDGE = "172.70.1.2";

describe("backend proxy request headers", () => {
  it("hands Spring the client IP and language headers exactly as Traefik sent them", async () => {
    const received = backend(() => new HttpResponse(null, { status: 204 }));

    await call("/api/contact", {
      method: "POST",
      headers: {
        "X-Forwarded-For": `${VISITOR}, ${CLOUDFLARE_EDGE}`,
        "CF-Connecting-IP": VISITOR,
        "Accept-Language": "sl",
        Origin: "http://localhost:3000",
      },
      body: "{}",
    });

    // ClientIp.java trusts only the last hop and CF-Connecting-IP, so a rewritten hop would key the limits on the frontend.
    const headers = received[0].headers;
    expect(headers.get("x-forwarded-for")).toBe(
      `${VISITOR}, ${CLOUDFLARE_EDGE}`,
    );
    expect(headers.get("cf-connecting-ip")).toBe(VISITOR);
    expect(headers.get("accept-language")).toBe("sl");
  });

  it("never passes the browser's own token, cookie or other headers on", async () => {
    const received = backend();

    await call("/api/users/me", {
      headers: {
        Authorization: "Bearer stolen",
        "X-Forwarded-Host": "evil.example",
        "X-Disscount-Debug": "1",
      },
      session: "user-a",
      pin: "user-a",
    });

    const headers = received[0].headers;
    expect(headers.get("authorization")).not.toContain("stolen");
    expect(headers.has("cookie")).toBe(false);
    expect(headers.has("x-forwarded-host")).toBe(false);
    expect(headers.has("x-disscount-debug")).toBe(false);
    expect(headers.has("x-disscount-user")).toBe(false);
  });
});

describe("backend proxy response", () => {
  it("drops Spring's encoding and cookie headers and marks private data uncacheable", async () => {
    backend(
      () =>
        new HttpResponse('{"ok":true}', {
          headers: {
            "content-type": "application/json",
            "content-encoding": "gzip",
            "set-cookie": "JSESSIONID=1",
            "www-authenticate": "Bearer",
            etag: '"v1"',
          },
        }),
    );

    const response = await call("/api/users/me");

    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("www-authenticate")).toBeNull();
    expect(response.headers.get("etag")).toBe('"v1"');
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("server-timing")).toMatch(
      /^auth;dur=[\d.]+, upstream;dur=[\d.]+$/,
    );
  });

  it("keeps Spring's own cache-control, as the card photos need", async () => {
    backend(
      () =>
        new HttpResponse(null, {
          headers: { "cache-control": "private, max-age=31536000, immutable" },
        }),
    );

    const response = await call("/api/digital-cards/c1/photos/full");

    expect(response.headers.get("cache-control")).toBe(
      "private, max-age=31536000, immutable",
    );
  });

  it("passes a problem body and its status through untouched", async () => {
    const erased = { code: "account_erased", userId: "user-a" };
    backend(() =>
      HttpResponse.json(erased, {
        status: 410,
        headers: { "content-type": "application/problem+json" },
      }),
    );

    const response = await call("/api/users/me");

    expect(response.status).toBe(410);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(await response.json()).toEqual(erased);
  });

  it.each([
    ["a 204", "DELETE", 204],
    ["a 304", "GET", 304],
    ["a HEAD", "HEAD", 200],
  ])("answers %s with no body", async (_, method, status) => {
    backend(
      () => new HttpResponse(status === 200 ? "ignored" : null, { status }),
    );

    const response = await call("/api/digital-cards/c1/photos/full", {
      method,
      headers: { Origin: "http://localhost:3000" },
    });

    expect(response.status).toBe(status);
    expect(response.body).toBeNull();
  });
});

describe("backend proxy bodies", () => {
  it("streams a multipart photo upload with its boundary", async () => {
    let uploaded: number[] = [];
    server.use(
      http.put(
        `${BACKEND}/api/digital-cards/c1/photos/front`,
        async ({ request }) => {
          const full = (await request.formData()).get("full") as File;
          uploaded = [...new Uint8Array(await full.arrayBuffer())];
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    const form = new FormData();
    form.append("full", new Blob([new Uint8Array([1, 2, 3])]), "full.webp");
    const upload = new Request("http://x", { method: "PUT", body: form });

    await call("/api/digital-cards/c1/photos/front", {
      method: "PUT",
      headers: {
        "content-type": upload.headers.get("content-type")!,
        Origin: "http://localhost:3000",
      },
      body: upload.body!,
    });

    expect(uploaded).toEqual([1, 2, 3]);
  });

  it("streams a binary photo back byte for byte", async () => {
    const bytes = new Uint8Array([0, 255, 128, 7]);
    backend(
      () =>
        new HttpResponse(bytes, { headers: { "content-type": "image/webp" } }),
    );

    const response = await call("/api/digital-cards/c1/photos/full");

    expect(response.headers.get("content-type")).toBe("image/webp");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([
      ...bytes,
    ]);
  });
});
