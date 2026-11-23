import { describe, expect, it } from "vitest";

import { categoryPriceFacts } from "@/app/[locale]/categories/utils/category-price-facts";
import { chain, product } from "@/test/price-fixtures";

describe("categoryPriceFacts", () => {
  it("spans the product averages and names the chain cheapest most often", () => {
    const facts = categoryPriceFacts([
      product([chain("lidl", "0.89", "0.99", "0.95"), chain("konzum", "1.09")]),
      product([chain("lidl", "1.19"), chain("spar", "1.29", "1.49", "1.39")]),
      product([chain("konzum", "0.79"), chain("spar", "0.99")]),
    ]);

    // Averages per product: (0.95 + 1.09) / 2, (1.19 + 1.39) / 2, (0.79 + 0.99) / 2.
    expect(facts).toEqual({
      chainCount: 3,
      lowAverage: expect.closeTo(0.89, 5),
      highAverage: expect.closeTo(1.29, 5),
      priced: 3,
      cheapest: { chain: "lidl", wins: 2 },
    });
  });

  it("breaks a tie by chain code, so the sentence stays stable", () => {
    const facts = categoryPriceFacts([
      product([chain("spar", "1.00")]),
      product([chain("konzum", "1.00")]),
    ]);

    expect(facts?.cheapest).toEqual({ chain: "konzum", wins: 1 });
  });

  it("skips products without a price and states nothing when none has one", () => {
    expect(categoryPriceFacts([product([chain("lidl", "")])])).toBeNull();
    expect(categoryPriceFacts([])).toBeNull();
  });
});
