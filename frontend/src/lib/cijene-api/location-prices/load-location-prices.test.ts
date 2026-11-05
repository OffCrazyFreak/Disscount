import { describe, expect, it, vi } from "vitest";
import { createPriceCache } from "@/lib/cijene-api/location-prices/price-cache";
import {
  loadLocationPrices,
  MAX_CITY_REQUESTS,
} from "@/lib/cijene-api/location-prices/load-location-prices";
import { storePrice } from "@/lib/cijene-api/location-prices/test-rows";

const CITIES = ["Osijek", "Pula", "Rijeka", "Split", "Zagreb"];
const ROWS = CITIES.map((city, index) =>
  storePrice("1", city, `${index + 1}.00`),
);

function newCache() {
  return createPriceCache({ ttlMs: 60_000, maxEntries: 100 });
}

function fetcher() {
  return vi.fn(async (city?: string) =>
    city ? ROWS.filter((row) => row.store.city?.includes(city)) : ROWS,
  );
}

function load(cities: string[], fetch = fetcher(), cache = newCache()) {
  return loadLocationPrices(
    { eans: "1", chains: "konzum", cities },
    fetch,
    cache,
  );
}

describe("loadLocationPrices", () => {
  it("asks city by city up to the limit", async () => {
    const fetch = fetcher();
    const cities = CITIES.slice(0, MAX_CITY_REQUESTS);

    const result = await load(cities, fetch);

    expect(fetch.mock.calls.map(([city]) => city)).toEqual(cities);
    expect(result).toEqual({
      prices: { "1": { min: 1, max: 3 } },
      partial: false,
    });
  });

  it("makes one country-wide request above the limit", async () => {
    const fetch = fetcher();

    const result = await load(CITIES.slice(0, MAX_CITY_REQUESTS + 1), fetch);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith();
    expect(result.prices).toEqual({ "1": { min: 1, max: 4 } });
  });

  it("serves later searches from the cache, including cities the country-wide answer covered", async () => {
    const fetch = fetcher();
    const cache = newCache();

    await load(CITIES.slice(0, 4), fetch, cache);
    const result = await load(["Zagreb", "Osijek"], fetch, cache);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.prices).toEqual({ "1": { min: 1, max: 5 } });
  });

  it("reports a partial answer when some cities fail", async () => {
    const fetch = vi.fn(async (city?: string) => {
      if (city === "Split") throw new Error("upstream down");
      return ROWS.filter((row) => row.store.city === city);
    });

    const result = await load(["Split", "Zagreb"], fetch);

    expect(result).toEqual({
      prices: { "1": { min: 5, max: 5 } },
      partial: true,
    });
  });

  it("rethrows when nothing loaded, so the route keeps the upstream status", async () => {
    const error = new Error("upstream down");
    const fetch = vi.fn(async () => {
      throw error;
    });

    await expect(load(["Split"], fetch)).rejects.toBe(error);
  });
});
