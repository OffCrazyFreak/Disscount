import { describe, expect, it } from "vitest";

import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { StorePrice } from "@/lib/cijene-api/schemas";

import {
  locatePricedStores,
  nearestDistanceByChain,
} from "./nearest-chain-distance";

const ZAGREB = { lat: 45.813, lon: 15.977 };

describe("nearestDistanceByChain", () => {
  it("keeps each chain's closest located store", () => {
    const distances = nearestDistanceByChain(ZAGREB, [
      { chain: "konzum", lat: 45.55, lon: 18.69 },
      { chain: "konzum", lat: 45.813, lon: 15.987 },
      { chain: "lidl", lat: 45.33, lon: 14.44 },
      { chain: "spar", lat: null, lon: null },
    ]);

    expect(distances.get("konzum")).toBeCloseTo(0.78, 1);
    expect(distances.get("lidl")).toBeGreaterThan(100);
    expect(distances.has("spar")).toBe(false);
  });
});

function price(chain: string, code: string, lat: number | null) {
  return {
    chain,
    ean: "1",
    price_date: "2026-01-01",
    regular_price: "1.00",
    special_price: null,
    unit_price: null,
    best_price_30: null,
    anchor_price: null,
    store: {
      chain_id: 1,
      code,
      type: null,
      address: null,
      city: null,
      zipcode: null,
      lat,
      lon: lat,
      phone: null,
    },
  } satisfies StorePrice;
}

function listed(chain: string, code: string, lat: number | null) {
  return {
    chain,
    code,
    type: null,
    address: null,
    city: null,
    zipcode: null,
    phone: null,
    lat,
    lon: lat,
    locationSource: null,
  } satisfies DirectoryStoreDto;
}

describe("locatePricedStores", () => {
  it("prefers the directory pin and falls back to upstream's", () => {
    expect(
      locatePricedStores(
        [price("konzum", "1", 10), price("konzum", "2", 20)],
        [listed("konzum", "1", 30), listed("lidl", "2", 40)],
      ),
    ).toEqual([
      { chain: "konzum", lat: 30, lon: 30 },
      { chain: "konzum", lat: 20, lon: 20 },
    ]);
  });

  it("trusts a directory miss over upstream's pin", () => {
    expect(
      locatePricedStores([price("spar", "1", 10)], [listed("spar", "1", null)]),
    ).toEqual([{ chain: "spar", lat: null, lon: null }]);
  });
});
