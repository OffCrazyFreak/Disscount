import { describe, expect, it } from "vitest";

import { productResponseSchema } from "@/lib/cijene-api/schemas";
import { chain } from "@/test/price-fixtures";

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

  it("drops a price with a comma or trailing text, which parseFloat would misread", () => {
    const parsed = productResponseSchema.parse(
      product([
        chain("spar", "1,29"),
        chain("dm", "1.29abc"),
        chain("lidl", "1.29"),
      ]),
    );

    expect(parsed.chains.map((entry) => entry.chain)).toEqual(["lidl"]);
  });

  it("still fails when a chain entry has the wrong shape, so an upstream change is noticed", () => {
    expect(() =>
      productResponseSchema.parse(
        product([{ chain: "spar" }, chain("lidl", "1.29")]),
      ),
    ).toThrow();
  });

  it("keeps a Decimal written with an exponent", () => {
    const parsed = productResponseSchema.parse(
      product([chain("lidl", "1E+1")]),
    );

    expect(parsed.chains).toHaveLength(1);
  });

  it("keeps the output parseable again, as the proxy route and the client both parse it", () => {
    const once = productResponseSchema.parse(product([chain("lidl", "1.29")]));

    expect(productResponseSchema.parse(once)).toEqual(once);
  });
});
