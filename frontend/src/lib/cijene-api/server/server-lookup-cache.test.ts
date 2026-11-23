import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw-server";

vi.mock("server-only", () => ({}));

const nextCache = vi.hoisted(() => ({
  stored: new Map<string, unknown>(),
  keyParts: [] as string[][],
  revalidate: [] as (number | false | undefined)[],
}));

// Mirrors Next: the key is the key parts plus the arguments, and only a resolved value is stored.
vi.mock("next/cache", () => ({
  unstable_cache:
    <A extends unknown[], R>(
      fn: (...args: A) => Promise<R>,
      keyParts: string[],
      options: { revalidate?: number | false },
    ) =>
    async (...args: A): Promise<R> => {
      nextCache.keyParts.push(keyParts);
      nextCache.revalidate.push(options.revalidate);
      const key = `${keyParts.join(",")}-${JSON.stringify(args)}`;

      if (nextCache.stored.has(key)) return nextCache.stored.get(key) as R;

      const value = await fn(...args);
      nextCache.stored.set(key, value);
      return value;
    },
}));

// Fresh modules per test, so a miss one test remembers never answers the next.
async function lookups() {
  vi.resetModules();

  return {
    ...(await import("@/lib/cijene-api/server/get-product")),
    ...(await import("@/lib/cijene-api/server/get-product-prices")),
  };
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

const EAN = "5449000000996";
const product = {
  ean: EAN,
  brand: "Coca-Cola",
  name: "Coca-Cola Limenka",
  quantity: null,
  unit: null,
  chains: [],
};

function upstreamProduct(status: number, body: object = product) {
  let calls = 0;

  server.use(
    http.get(`*/v1/products/${EAN}`, () => {
      calls += 1;
      return status === 200
        ? HttpResponse.json(body)
        : new HttpResponse(null, { status });
    }),
  );

  return () => calls;
}

describe("server product lookups", () => {
  beforeEach(() => {
    nextCache.stored.clear();
    nextCache.keyParts.length = 0;
    nextCache.revalidate.length = 0;
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keys the product and its prices apart, revalidating hourly", async () => {
    const { getServerProduct, getServerProductPrices } = await lookups();
    upstreamProduct(200);
    server.use(http.get("*/v1/prices", () => HttpResponse.error()));

    await getServerProduct(EAN);
    await getServerProductPrices(EAN);

    expect(nextCache.keyParts).toEqual([
      ["cijene-server-product"],
      ["cijene-server-product-prices"],
    ]);
    expect(nextCache.revalidate).toEqual([3600, 3600]);
  });

  it("serves a found product from the cache with the time upstream answered", async () => {
    const { getServerProduct } = await lookups();
    const calls = upstreamProduct(200);
    const fetchedAt = Date.now();

    await getServerProduct(EAN);
    vi.setSystemTime(fetchedAt + TEN_MINUTES_MS);
    const second = await getServerProduct(EAN);

    expect(second).toEqual({ status: "found", product, fetchedAt });
    expect(calls()).toBe(1);
  });

  it("remembers a missing product for ten minutes, outside the hourly cache", async () => {
    const { getServerProduct } = await lookups();
    const calls = upstreamProduct(404);
    const firstMiss = Date.now();

    expect(await getServerProduct(EAN)).toEqual({ status: "missing" });
    vi.setSystemTime(firstMiss + TEN_MINUTES_MS - 1);
    expect(await getServerProduct(EAN)).toEqual({ status: "missing" });
    expect(calls()).toBe(1);
    expect(nextCache.stored.size).toBe(0);

    vi.setSystemTime(firstMiss + TEN_MINUTES_MS);
    upstreamProduct(200);

    expect(await getServerProduct(EAN)).toMatchObject({ status: "found" });
  });

  it("never stores an outage, so the next request asks upstream again", async () => {
    const { getServerProduct } = await lookups();
    upstreamProduct(503);

    expect(await getServerProduct(EAN)).toEqual({ status: "unavailable" });
    expect(nextCache.stored.size).toBe(0);

    upstreamProduct(200);

    expect(await getServerProduct(EAN)).toMatchObject({ status: "found" });
  });

  it("never stores a product of the wrong shape", async () => {
    const { getServerProduct } = await lookups();
    upstreamProduct(200, { ean: EAN });

    expect(await getServerProduct(EAN)).toEqual({ status: "unavailable" });
    expect(nextCache.stored.size).toBe(0);
  });

  it("serves cached prices with the time upstream answered", async () => {
    const { getServerProductPrices } = await lookups();
    const prices = { store_prices: [] };
    let calls = 0;
    server.use(
      http.get("*/v1/prices", () => {
        calls += 1;
        return HttpResponse.json(prices);
      }),
    );
    const fetchedAt = Date.now();

    await getServerProductPrices(EAN);
    vi.setSystemTime(fetchedAt + TEN_MINUTES_MS);

    expect(await getServerProductPrices(EAN)).toEqual({
      data: prices,
      fetchedAt,
    });
    expect(calls).toBe(1);
  });

  it("never stores failed prices", async () => {
    const { getServerProductPrices } = await lookups();
    server.use(http.get("*/v1/prices", () => HttpResponse.error()));

    expect(await getServerProductPrices(EAN)).toBeNull();
    expect(nextCache.stored.size).toBe(0);
  });

  it("never stores prices of the wrong shape", async () => {
    const { getServerProductPrices } = await lookups();
    server.use(
      http.get("*/v1/prices", () => HttpResponse.json({ prices: [] })),
    );

    expect(await getServerProductPrices(EAN)).toBeNull();
    expect(nextCache.stored.size).toBe(0);
  });
});
