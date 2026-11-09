import { describe, expect, it } from "vitest";

import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { StorePrice } from "@/lib/cijene-api/schemas";

import {
  locatePricedStores,
  nearestStoreByChain,
} from "@/utils/nearest-chain-distance";

const ZAGREB = { lat: 45.813, lon: 15.977 };

describe("nearestStoreByChain", () => {
  it("keeps each chain's closest located store", () => {
    const nearest = nearestStoreByChain(ZAGREB, [
      {
        chain: "konzum",
        code: "far",
        address: null,
        city: null,
        lat: 45.55,
        lon: 18.69,
      },
      {
        chain: "konzum",
        code: "near",
        address: "Ilica 1",
        city: "Zagreb",
        lat: 45.813,
        lon: 15.987,
      },
      {
        chain: "lidl",
        code: "1",
        address: null,
        city: null,
        lat: 45.33,
        lon: 14.44,
      },
      {
        chain: "spar",
        code: "1",
        address: null,
        city: null,
        lat: null,
        lon: null,
      },
    ]);

    expect(nearest.get("konzum")?.key).toBe("konzum:near");
    expect(nearest.get("konzum")?.km).toBeCloseTo(0.78, 1);
    expect(nearest.get("konzum")?.address).toBe("Ilica 1");
    expect(nearest.get("lidl")?.km).toBeGreaterThan(100);
    expect(nearest.has("spar")).toBe(false);
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
      {
        chain: "konzum",
        code: "1",
        address: null,
        city: null,
        lat: 30,
        lon: 30,
      },
      {
        chain: "konzum",
        code: "2",
        address: null,
        city: null,
        lat: 20,
        lon: 20,
      },
    ]);
  });

  it("trusts a directory miss over upstream's pin", () => {
    expect(
      locatePricedStores([price("spar", "1", 10)], [listed("spar", "1", null)]),
    ).toEqual([
      {
        chain: "spar",
        code: "1",
        address: null,
        city: null,
        lat: null,
        lon: null,
      },
    ]);
  });
});
