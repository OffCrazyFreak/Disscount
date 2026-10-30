import { describe, expect, it } from "vitest";

import type { ChainProductResponse } from "@/lib/cijene-api/schemas";

import {
  compareStoreChains,
  type StoreOptimizeMode,
} from "./store-sorting-utils";

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

function order(
  pinned: string[],
  mode?: StoreOptimizeMode,
  counts?: Map<string, number>,
) {
  return [...chains]
    .sort((a, b) => compareStoreChains(a, b, pinned, mode, counts))
    .map((c) => c.chain);
}

describe("compareStoreChains", () => {
  it("ranks by item count, then name, by default", () => {
    expect(order([])).toEqual(["konzum", "lidl", "Čakovec", "spar", "dm"]);
  });

  it("treats distance like products", () => {
    expect(order([], "distance")).toEqual(order([], "products"));
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

  it("puts pinned chains first in every mode", () => {
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
