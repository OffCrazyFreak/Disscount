import { describe, expect, it } from "vitest";

import { productResponseSchema } from "@/lib/cijene-api/schemas";

function chain(chainCode: string, avgPrice: string) {
  return {
    chain: chainCode,
    code: "1",
    name: "Mlijeko",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: avgPrice,
    max_price: avgPrice,
    avg_price: avgPrice,
    price_date: "2026-11-03",
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

describe("productResponseSchema", () => {
  it("drops a chain whose price is not a number and keeps the rest", () => {
    const parsed = productResponseSchema.parse(
      product([chain("konzum", "abc"), chain("lidl", "1.29")]),
    );

    expect(parsed.chains.map((entry) => entry.chain)).toEqual(["lidl"]);
  });

  it("drops a malformed chain entry without failing the product", () => {
    const parsed = productResponseSchema.parse(
      product([{ chain: "spar" }, chain("lidl", "1.29")]),
    );

    expect(parsed.chains.map((entry) => entry.chain)).toEqual(["lidl"]);
  });

  it("keeps the output parseable again, as the proxy route and the client both parse it", () => {
    const once = productResponseSchema.parse(product([chain("lidl", "1.29")]));

    expect(productResponseSchema.parse(once)).toEqual(once);
  });
});
