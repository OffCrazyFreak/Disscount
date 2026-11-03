import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/store-hours/get-store-hours", () => ({
  getStoreHours: () => Promise.reject(new Error("database down")),
}));

const { GET } = await import("@/app/api/cijene/store-hours/route");

describe("GET /api/cijene/store-hours", () => {
  it("answers a failed load with a translated problem nobody caches", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(
      new Request("http://localhost:3000/api/cijene/store-hours", {
        headers: { "accept-language": "it" },
      }),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      status: 502,
      code: "upstream_unavailable",
      title: "Servizio non disponibile",
    });
  });
});
