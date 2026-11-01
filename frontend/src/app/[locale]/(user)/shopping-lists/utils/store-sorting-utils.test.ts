import { describe, expect, it } from "vitest";

import type { ChainProductResponse } from "@/lib/cijene-api/schemas";

import {
  compareStoreChains,
  type StoreOptimizeMode,
} from "@/app/[locale]/(user)/shopping-lists/utils/store-sorting-utils";

type Chain = ChainProductResponse & { itemCount: number };

function chain(name: string, itemCount: number, avgPrice: string): Chain {
  return {
    chain: name,
    code: "",
    name: "",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: avgPrice,
    max_price: avgPrice,
    avg_price: avgPrice,
    price_date: "2026-01-01",
    itemCount,
  };
}

const chains = [
  chain("spar", 3, "2.00"),
  chain("lidl", 5, "3.00"),
  chain("konzum", 5, "1.50"),
  chain("dm", 2, "1.00"),
  chain("Čakovec", 3, "2.00"),
];

const cheapest = new Map([
  ["dm", 2],
  ["spar", 2],
  ["lidl", 1],
]);

const distances = new Map([
  ["dm", 0.4],
  ["spar", 2.5],
  ["lidl", 2.5],
  ["Čakovec", 9],
]);

function order(
  pinned: string[],
  mode?: StoreOptimizeMode,
  counts?: Map<string, number>,
  byChain?: Map<string, number>,
) {
  return [...chains]
    .sort((a, b) => compareStoreChains(a, b, pinned, mode, counts, byChain))
    .map((c) => c.chain);
}

describe("compareStoreChains", () => {
  it("ranks by item count, then name, by default", () => {
    expect(order([])).toEqual(["konzum", "lidl", "Čakovec", "spar", "dm"]);
  });

  it("ranks by nearest store, then item count, in distance mode", () => {
    expect(order([], "distance", undefined, distances)).toEqual([
      "dm",
      "lidl",
      "spar",
      "Čakovec",
      "konzum",
    ]);
  });

  it("orders chains in the same half-kilometre band by items, then price", () => {
    const close = new Map([
      ["dm", 0.1],
      ["spar", 0.4],
      ["lidl", 0.45],
      ["konzum", 0.3],
      ["Čakovec", 0.6],
    ]);

    expect(order([], "distance", undefined, close)).toEqual([
      "konzum",
      "lidl",
      "spar",
      "dm",
      "Čakovec",
    ]);
  });

  it("ignores pinned chains in distance mode", () => {
    expect(order(["konzum"], "distance", undefined, distances)[0]).toBe("dm");
  });

  it("ranks by item count, then price, in basket mode", () => {
    expect(order([], "basket")).toEqual([
      "konzum",
      "lidl",
      "Čakovec",
      "spar",
      "dm",
    ]);
  });

  it("ranks by cheapest count, then price, in total mode", () => {
    expect(order([], "total", cheapest)).toEqual([
      "dm",
      "spar",
      "lidl",
      "konzum",
      "Čakovec",
    ]);
  });

  it("treats a missing cheapest map as all zero in total mode", () => {
    expect(order([], "total")).toEqual([
      "dm",
      "konzum",
      "Čakovec",
      "spar",
      "lidl",
    ]);
  });

  it("puts pinned chains first in every other mode", () => {
    expect(order(["dm", "spar"])).toEqual([
      "spar",
      "dm",
      "konzum",
      "lidl",
      "Čakovec",
    ]);
    expect(order(["lidl"], "total", cheapest)[0]).toBe("lidl");
    expect(order(["dm"], "basket")[0]).toBe("dm");
  });
});
