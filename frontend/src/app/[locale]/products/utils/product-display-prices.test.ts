import { describe, expect, it } from "vitest";

import { getDisplayPrices } from "@/app/[locale]/products/utils/product-display-prices";
import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

function chain(min: string, max: string): ChainProductResponse {
  return {
    chain: "konzum",
    code: "1",
    name: "Mlijeko",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: min,
    max_price: max,
    avg_price: min,
    price_date: "2026-10-13",
  };
}

const product: ProductResponse = {
  ean: "1",
  brand: null,
  name: null,
  quantity: "2",
  unit: "l",
  chains: [chain("1.00", "3.00")],
};

describe("getDisplayPrices", () => {
  it("falls back to the product's own prices when no list price is given", () => {
    expect(getDisplayPrices(product, undefined)).toEqual({
      minPrice: 1,
      maxPrice: 3,
      minPricePerUnit: 0.5,
      maxPricePerUnit: 1.5,
    });
  });

  it("uses the list price override and derives unit prices from it", () => {
    const price = { minPrice: 2, maxPrice: 4, scope: "chains" as const };

    expect(getDisplayPrices(product, price)).toEqual({
      minPrice: 2,
      maxPrice: 4,
      minPricePerUnit: 1,
      maxPricePerUnit: 2,
    });
  });

  it("shows no price when the filters left none", () => {
    expect(getDisplayPrices(product, null)).toEqual({
      minPrice: null,
      maxPrice: null,
      minPricePerUnit: undefined,
      maxPricePerUnit: undefined,
    });
  });
});
