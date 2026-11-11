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

const { backend, call, signTokensFromCookie } =
  await import("@/test/proxy-call");
const { JSON_BODY_LIMIT, PHOTO_BODY_LIMIT, PROFILE_BODY_LIMIT, bodyLimit } =
  await import("@/lib/backend-proxy/request-body");

signTokensFromCookie(mocks.getToken);

const SIGNED_IN = { session: "user-a", pin: "user-a" };

/** A body with no Content-Length, sent in small chunks the way a slow client would. */
function chunkedBody(totalBytes: number, chunkBytes = 8 * 1024) {
  let sent = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= totalBytes) {
        controller.close();
        return;
      }

      const size = Math.min(chunkBytes, totalBytes - sent);
      controller.enqueue(new Uint8Array(size).fill(120));
      sent += size;
    },
  });
}

describe("backend proxy body limit", () => {
  it("passes a body at the limit to Spring unchanged", async () => {
    const received = backend();
    const body = "x".repeat(JSON_BODY_LIMIT);

    const response = await call("/api/contact", { method: "POST", body });

    expect(response.status).toBe(200);
    expect(await received[0].text()).toBe(body);
  });

  it("answers 413 for a declared length over the limit without calling Spring", async () => {
    const received = backend();

    // Only the header is over the limit, so a 413 proves the proxy refused before reading.
    const response = await call("/api/contact", {
      method: "POST",
      headers: { "Content-Length": String(JSON_BODY_LIMIT + 1) },
      body: "{}",
    });

    expect(response.status).toBe(413);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(await response.json()).toMatchObject({
      code: "payload_too_large",
      title: "Zahtjev je prevelik",
    });
    expect(received).toHaveLength(0);
  });

  it("answers 413 for a chunked body without a length once the bytes pass the limit", async () => {
    const received = backend();

    const response = await call("/api/contact", {
      method: "POST",
      body: chunkedBody(JSON_BODY_LIMIT * 4),
    });

    expect(response.status).toBe(413);
    expect(received).toHaveLength(0);
  });

  it("forwards a chunked body under the limit whole", async () => {
    const received = backend();

    const response = await call("/api/shopping-lists/me", {
      method: "POST",
      body: chunkedBody(20_000, 3_000),
      ...SIGNED_IN,
    });

    expect(response.status).toBe(200);
    expect((await received[0].arrayBuffer()).byteLength).toBe(20_000);
  });

  it("lets a photo upload through up to Spring's own multipart cap", async () => {
    const received = backend();

    const response = await call("/api/digital-cards/card-1/photos/front", {
      method: "PUT",
      body: chunkedBody(PHOTO_BODY_LIMIT),
      ...SIGNED_IN,
    });

    expect(response.status).toBe(200);
    expect(received).toHaveLength(1);
  });

  it("refuses a photo upload over Spring's multipart cap", async () => {
    const response = await call("/api/products/3850104000000/images", {
      method: "POST",
      body: chunkedBody(PHOTO_BODY_LIMIT + 1),
      ...SIGNED_IN,
    });

    expect(response.status).toBe(413);
  });
});

describe("bodyLimit", () => {
  it.each([
    ["PUT", "digital-cards/card-1/photos/front", PHOTO_BODY_LIMIT],
    ["POST", "products/3850104000000/images", PHOTO_BODY_LIMIT],
    ["PATCH", "users/me", PROFILE_BODY_LIMIT],
    ["POST", "contact", JSON_BODY_LIMIT],
    ["PUT", "digital-cards/card-1", JSON_BODY_LIMIT],
    ["POST", "digital-cards/card-1/photos/front", JSON_BODY_LIMIT],
    ["PATCH", "users/me/extra", JSON_BODY_LIMIT],
  ])("gives %s %s %i bytes", (method, path, limit) => {
    expect(bodyLimit(method, path.split("/"))).toBe(limit);
  });
});
