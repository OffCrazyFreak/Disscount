import { describe, expect, it, vi } from "vitest";

// A plain function, because a vi.fn that returns a rejected promise reports it as unhandled.
const load = vi.hoisted(() => ({
  result: (): Promise<unknown> => Promise.resolve(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/store-hours/get-store-hours", () => ({
  getStoreHours: () => load.result(),
}));

const { GET } = await import("@/app/api/cijene/store-hours/route");

const HOURS = {
  weeklyTemplates: [],
  baseDate: "2026-11-05",
  datedLists: [],
  verifiedTimes: [],
  checkUrls: [],
  stores: {},
  holidays: [],
  generatedAt: "2026-11-05T10:00:00.000Z",
};

function request() {
  return new Request("http://localhost:3000/api/cijene/store-hours", {
    headers: { "accept-language": "it" },
  });
}

describe("GET /api/cijene/store-hours", () => {
  it("lets browsers keep a complete set for an hour", async () => {
    load.result = () => Promise.resolve({ ...HOURS, complete: true });

    const response = await GET(request());

    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=3600, stale-while-revalidate=86400",
    );
  });

  it("forbids caching a set from before the first import finished", async () => {
    load.result = () => Promise.resolve({ ...HOURS, complete: false });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("answers a failed load with a translated problem nobody caches", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    load.result = () => Promise.reject(new Error("database down"));

    const response = await GET(request());

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      status: 502,
      code: "upstream_unavailable",
      title: "Servizio non disponibile",
    });
  });
});
