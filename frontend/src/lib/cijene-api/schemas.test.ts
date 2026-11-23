import { describe, expect, it } from "vitest";

import {
  productResponseSchema,
  storePricesResponseSchema,
  upstreamProductResponseSchema,
} from "@/lib/cijene-api/schemas";

function wireChain(chain: string, price: string) {
  return {
    chain,
    code: "1",
    name: "Mlijeko",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: price,
    max_price: price,
    avg_price: price,
    price_date: "2026-10-13",
  };
}

function product(chains: unknown[]) {
  return {
    ean: "3850104000001",
    brand: null,
    name: "Mlijeko",
    quantity: null,
    unit: null,
    chains,
  };
}

function wireStorePrice(prices: Record<string, string | null>) {
  return {
    chain: "konzum",
    ean: "3850104000001",
    price_date: "2026-10-13",
    regular_price: null,
    special_price: null,
    unit_price: null,
    best_price_30: null,
    anchor_price: null,
    ...prices,
    store: {
      chain_id: 1,
      code: "1",
      type: null,
      address: null,
      city: "Zagreb",
      zipcode: null,
      lat: null,
      lon: null,
      phone: null,
    },
  };
}

describe("upstreamProductResponseSchema", () => {
  it("drops a chain whose price is not a number and keeps the rest", () => {
    const parsed = upstreamProductResponseSchema.parse(
      product([wireChain("konzum", "abc"), wireChain("lidl", "1.29")]),
    );

    expect(parsed.chains.map((entry) => entry.chain)).toEqual(["lidl"]);
  });

  it("drops a price with a comma or trailing text, which parseFloat would misread", () => {
    const parsed = upstreamProductResponseSchema.parse(
      product([
        wireChain("spar", "1,29"),
        wireChain("dm", "1.29abc"),
        wireChain("lidl", "1.29"),
      ]),
    );

    expect(parsed.chains.map((entry) => entry.chain)).toEqual(["lidl"]);
  });

  it("drops a price too large to be a finite number", () => {
    const parsed = upstreamProductResponseSchema.parse(
      product([wireChain("spar", "1E+999"), wireChain("lidl", "1.29")]),
    );

    expect(parsed.chains.map((entry) => entry.chain)).toEqual(["lidl"]);
  });

  it("still fails when a chain entry has the wrong shape, so an upstream change is noticed", () => {
    expect(() =>
      upstreamProductResponseSchema.parse(
        product([{ chain: "spar" }, wireChain("lidl", "1.29")]),
      ),
    ).toThrow();
  });

  it("keeps the output parseable again, as the search merge and the route both parse it", () => {
    const once = upstreamProductResponseSchema.parse(
      product([wireChain("lidl", "1.29")]),
    );

    expect(upstreamProductResponseSchema.parse(once)).toEqual(once);
  });
});

describe("productResponseSchema", () => {
  it("turns readable chain prices into numbers, a Decimal exponent included", () => {
    const parsed = productResponseSchema.parse(
      product([wireChain("lidl", "1.29"), wireChain("spar", "1E+1")]),
    );

    expect(parsed.chains.map((entry) => entry.min_price)).toEqual([1.29, 10]);
  });

  it("drops a chain whose average is zero, because zero is no price", () => {
    const parsed = productResponseSchema.parse(
      product([wireChain("dm", "0.00"), wireChain("lidl", "0.99")]),
    );

    expect(parsed.chains.map((entry) => entry.chain)).toEqual(["lidl"]);
  });

  it("falls back to the average for a zero lowest or highest price", () => {
    const parsed = productResponseSchema.parse(
      product([
        { ...wireChain("roto", "1.30"), min_price: "0.00", max_price: "0" },
      ]),
    );

    expect(parsed.chains[0]).toMatchObject({
      min_price: 1.3,
      max_price: 1.3,
      avg_price: 1.3,
    });
  });

  it("drops an unreadable chain before converting the rest", () => {
    const parsed = productResponseSchema.parse(
      product([wireChain("konzum", ""), wireChain("lidl", "0.99")]),
    );

    expect(parsed.chains).toEqual([
      expect.objectContaining({
        chain: "lidl",
        min_price: 0.99,
        max_price: 0.99,
        avg_price: 0.99,
      }),
    ]);
  });
});

describe("storePricesResponseSchema", () => {
  it("turns every store price into a number, and a zero into no price", () => {
    const parsed = storePricesResponseSchema.parse({
      store_prices: [
        wireStorePrice({
          regular_price: "1.29",
          special_price: "0.00",
          unit_price: "2.58",
          best_price_30: "1.19",
          anchor_price: "1.39",
        }),
      ],
    });

    expect(parsed.store_prices[0]).toMatchObject({
      regular_price: 1.29,
      special_price: null,
      unit_price: 2.58,
      best_price_30: 1.19,
      anchor_price: 1.39,
    });
  });

  it("makes an empty or unreadable store price null, so readers fall back instead of showing NaN", () => {
    const parsed = storePricesResponseSchema.parse({
      store_prices: [
        wireStorePrice({ regular_price: "1.29", special_price: "" }),
        wireStorePrice({ regular_price: "abc", special_price: null }),
      ],
    });

    expect(
      parsed.store_prices.map(({ regular_price, special_price }) => [
        regular_price,
        special_price,
      ]),
    ).toEqual([
      [1.29, null],
      [null, null],
    ]);
  });
});
