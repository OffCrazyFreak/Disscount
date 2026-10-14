import { describe, expect, it } from "vitest";

import {
  getAveragePrice,
  getCheapestChainByMinPrice,
  getMaxPrice,
  getMinPrice,
  parsePrice,
} from "@/utils/product-price-utils";
import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

function chain(
  name: string,
  min: string,
  max = min,
  avg = min,
): ChainProductResponse {
  return {
    chain: name,
    code: "1",
    name: "Mlijeko",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: min,
    max_price: max,
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

describe("parsePrice", () => {
  it("parses the API's decimal strings and rejects junk", () => {
    expect(parsePrice("1.29")).toBe(1.29);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("n/a")).toBeNull();
  });
});

describe("product price summary", () => {
  it("skips chains whose price does not parse", () => {
    const item = product([
      chain("konzum", "1.20", "1.50", "1.30"),
      chain("lidl", "0.99", "1.10", "1.00"),
      chain("spar", "", "", ""),
    ]);

    expect(getMinPrice(item)).toBe(0.99);
    expect(getMaxPrice(item)).toBe(1.5);
    expect(getAveragePrice(item)).toBeCloseTo(1.15);
  });

  it("has no price when no chain has one", () => {
    const item = product([chain("spar", "")]);

    expect(getMinPrice(item)).toBeNull();
    expect(getAveragePrice(item)).toBeNull();
  });
});

describe("getCheapestChainByMinPrice", () => {
  it("keeps the first chain on a tie", () => {
    const cheapest = getCheapestChainByMinPrice([
      chain("konzum", "1.20"),
      chain("lidl", "0.99"),
      chain("kaufland", "0.99"),
    ]);

    expect(cheapest?.chain.chain).toBe("lidl");
    expect(cheapest?.price).toBe(0.99);
  });

  it("is null when nothing is priced", () => {
    expect(getCheapestChainByMinPrice([chain("spar", "")])).toBeNull();
  });
});
