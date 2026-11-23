import { describe, expect, it } from "vitest";

import {
  chainStores,
  citiesByStoreCount,
  storeCountsByChain,
  topCitiesPhrase,
} from "@/app/[locale]/chains/utils/chain-stores";
import type { DirectoryStoreDto } from "@/lib/api/schemas";

function store(
  chain: string,
  city: string | null,
  address: string | null = "Ilica 1",
): DirectoryStoreDto {
  return {
    chain,
    code: `${chain}-${city}-${address}`,
    type: null,
    address,
    city,
    zipcode: null,
    lat: null,
    lon: null,
    phone: null,
    locationSource: null,
  };
}

describe("chainStores", () => {
  it("keeps the chain's stores the map can show", () => {
    const stores = [
      store("konzum", "Zagreb"),
      store("spar", "Zagreb"),
      store("konzum", null, null),
    ];

    expect(chainStores(stores, "konzum")).toEqual([stores[0]]);
  });
});

describe("storeCountsByChain", () => {
  it("counts visitable stores per chain", () => {
    const counts = storeCountsByChain([
      store("konzum", "Zagreb"),
      store("konzum", "Split"),
      store("dm", null, null),
    ]);

    expect(Object.fromEntries(counts)).toEqual({ konzum: 2 });
  });
});

describe("citiesByStoreCount", () => {
  it("ranks places by store count, then by name", () => {
    expect(
      citiesByStoreCount([
        store("konzum", "Zagreb"),
        store("konzum", "Split"),
        store("konzum", "Zagreb"),
        store("konzum", "Čakovec"),
        store("konzum", null),
      ]),
    ).toEqual([
      { city: "Zagreb", storeCount: 2 },
      { city: "Čakovec", storeCount: 1 },
      { city: "Split", storeCount: 1 },
    ]);
  });
});

describe("topCitiesPhrase", () => {
  const cities = [
    { city: "Zagreb", storeCount: 120 },
    { city: "Split", storeCount: 40 },
    { city: "Rijeka", storeCount: 30 },
    { city: "Osijek", storeCount: 20 },
  ];

  it("names the three places with most stores", () => {
    expect(topCitiesPhrase(cities, "hr")).toBe(
      "Zagreb (120), Split (40) i Rijeka (30)",
    );
  });

  it("says nothing for a chain in one place", () => {
    expect(topCitiesPhrase(cities.slice(0, 1), "hr")).toBeNull();
  });
});
