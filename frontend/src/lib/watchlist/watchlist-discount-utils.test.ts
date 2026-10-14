import { describe, expect, it } from "vitest";

import { calculateDiscountInfo } from "@/lib/watchlist/watchlist-discount-utils";
import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

function chain(name: string, min: string, avg: string): ChainProductResponse {
  return {
    chain: name,
    code: "1",
    name: "Mlijeko",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: min,
    max_price: min,
    avg_price: avg,
    price_date: "2026-10-13",
  };
}

function product(chains: ChainProductResponse[]): ProductResponse {
  return {
    ean: "1",
    brand: null,
    name: null,
    quantity: null,
    unit: null,
    chains,
  };
}

describe("calculateDiscountInfo", () => {
  it("compares the cheapest overall and cheapest pinned chain to the average", () => {
    const konzum = chain("konzum", "1.50", "2.00");
    const lidl = chain("lidl", "1.00", "2.00");

    expect(calculateDiscountInfo(product([konzum, lidl]), ["Konzum"])).toEqual({
      preferredDifference: -0.5,
      preferredPercentage: 25,
      preferredDiscount: 0.5,
      preferredMinPrice: 1.5,
      preferredBestChain: konzum,
      hasPreferredDiscount: true,
      totalDifference: -1,
      totalPercentage: 50,
      totalDiscount: 1,
      totalMinPrice: 1,
      totalBestChain: lidl,
      avgPrice: 2,
    });
  });

  it("reports no preferred values without pinned stores", () => {
    const spar = chain("spar", "2.50", "2.00");

    expect(calculateDiscountInfo(product([spar]), [])).toEqual({
      preferredDifference: null,
      preferredPercentage: null,
      preferredDiscount: null,
      preferredMinPrice: null,
      preferredBestChain: null,
      hasPreferredDiscount: false,
      totalDifference: 0.5,
      totalPercentage: 25,
      totalDiscount: 0,
      totalMinPrice: 2.5,
      totalBestChain: spar,
      avgPrice: 2,
    });
  });

  it("keeps the cheapest prices but no comparison when there is no average", () => {
    const konzum = chain("konzum", "1.50", "x");

    expect(calculateDiscountInfo(product([konzum]), ["konzum"])).toEqual({
      preferredDifference: null,
      preferredPercentage: null,
      preferredDiscount: null,
      preferredMinPrice: 1.5,
      preferredBestChain: konzum,
      hasPreferredDiscount: false,
      totalDifference: null,
      totalPercentage: null,
      totalDiscount: null,
      totalMinPrice: 1.5,
      totalBestChain: konzum,
      avgPrice: 0,
    });
  });

  it("returns all nulls for a product without priced chains", () => {
    expect(calculateDiscountInfo(product([]), ["konzum"])).toEqual({
      preferredDifference: null,
      preferredPercentage: null,
      preferredDiscount: null,
      preferredMinPrice: null,
      preferredBestChain: null,
      hasPreferredDiscount: false,
      totalDifference: null,
      totalPercentage: null,
      totalDiscount: null,
      totalMinPrice: null,
      totalBestChain: null,
      avgPrice: 0,
    });
  });
});
