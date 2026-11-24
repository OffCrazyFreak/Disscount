import { describe, expect, it } from "vitest";
import { createPriceCache } from "@/lib/cijene-api/location-prices/price-cache";

describe("createPriceCache", () => {
  it("expires entries after the TTL", () => {
    let time = 0;
    const cache = createPriceCache({
      ttlMs: 100,
      maxEntries: 10,
      now: () => time,
    });
    const value = Promise.resolve(new Map());

    cache.set("a", value);
    time = 99;
    expect(cache.get("a")).toBe(value);
    time = 100;
    expect(cache.get("a")).toBeUndefined();
  });

  it("drops the oldest entry when full", () => {
    const cache = createPriceCache({ ttlMs: 1000, maxEntries: 2 });

    cache.set("a", Promise.resolve(new Map()));
    cache.set("b", Promise.resolve(new Map()));
    cache.set("c", Promise.resolve(new Map()));

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBeDefined();
  });

  it("forgets a failed request instead of serving it", async () => {
    const cache = createPriceCache({ ttlMs: 1000, maxEntries: 10 });
    const failed = Promise.reject(new Error("upstream down"));

    cache.set("a", failed);
    await failed.catch(() => undefined);

    expect(cache.get("a")).toBeUndefined();
  });
});
