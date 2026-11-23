import { describe, expect, it } from "vitest";

import {
  compareProductChains,
  type ProductChainSortMode,
} from "@/features/products/utils/product-chain-sort";
import { chain as priceChain } from "@/test/price-fixtures";

function chain(name: string, minPrice: number, avgPrice: number) {
  return priceChain(name, minPrice, avgPrice, avgPrice);
}

const chains = [
  chain("konzum", 1, 2),
  chain("lidl", 1.5, 1.5),
  chain("spar", 0.9, 2.5),
  chain("plodine", 1.2, 1.8),
];

const distances = new Map([
  ["spar", 4.2],
  ["konzum", 0.3],
  ["lidl", 1.1],
]);

function order(
  mode: ProductChainSortMode,
  pinned: string[] = [],
  byChain?: Map<string, number>,
) {
  return [...chains]
    .sort((a, b) => compareProductChains(a, b, pinned, mode, byChain))
    .map((c) => c.chain);
}

describe("compareProductChains", () => {
  it("leads with the nearest chain in distance mode", () => {
    expect(order("distance", [], distances)).toEqual([
      "konzum",
      "lidl",
      "spar",
      "plodine",
    ]);
  });

  it("orders differently from the price sorts", () => {
    expect(order("distance", [], distances)).not.toEqual(order("price"));
    expect(order("distance", [], distances)).not.toEqual(order("stores"));
  });

  it("ignores pinned chains in distance mode", () => {
    expect(order("distance", ["spar"], distances)[0]).toBe("konzum");
  });

  it("breaks distance ties by the cheapest store", () => {
    const tied = new Map([
      ["konzum", 1],
      ["spar", 1],
    ]);

    expect(order("distance", [], tied)).toEqual([
      "spar",
      "konzum",
      "plodine",
      "lidl",
    ]);
  });

  it("puts pinned chains first, then the lowest average, in stores mode", () => {
    expect(order("stores", ["spar"])).toEqual([
      "spar",
      "lidl",
      "plodine",
      "konzum",
    ]);
  });
});
