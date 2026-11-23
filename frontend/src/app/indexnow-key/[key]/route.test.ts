import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { GET } = await import("@/app/indexnow-key/[key]/route");

const KEY = "a1b2c3d4e5f6a7b8";

function fetchKeyFile(key: string) {
  return GET(new Request(`http://localhost:3000/${key}.txt`), {
    params: Promise.resolve({ key }),
  });
}

describe("GET /<IndexNow key>.txt", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("answers the configured key with the key as plain text", async () => {
    vi.stubEnv("INDEXNOW_KEY", KEY);

    const response = await fetchKeyFile(KEY);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(await response.text()).toBe(KEY);
  });

  it("is a 404 for any other name", async () => {
    vi.stubEnv("INDEXNOW_KEY", KEY);

    expect((await fetchKeyFile("someoneelseskey1")).status).toBe(404);
  });

  it("is a 404 while no key is set", async () => {
    vi.stubEnv("INDEXNOW_KEY", "");

    expect((await fetchKeyFile(KEY)).status).toBe(404);
  });
});
