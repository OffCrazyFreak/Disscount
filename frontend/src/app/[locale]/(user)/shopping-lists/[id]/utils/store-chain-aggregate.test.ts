import { describe, expect, it } from "vitest";

import { buildChainAggregates } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-chain-aggregate";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { chain, product } from "@/test/price-fixtures";

const item = { ean: "1", amount: 2 } as ShoppingListItemDto;

describe("buildChainAggregates", () => {
  it("leaves out a chain whose only price is zero", () => {
    const aggregates = buildChainAggregates(
      [product([chain("konzum", "1.20"), chain("roto", "0.00")])],
      [item],
    );

    expect(aggregates.map((aggregate) => aggregate.chain)).toEqual(["konzum"]);
    expect(aggregates[0].avg_price).toBe("2.40");
  });

  it("falls back to the average for a zero lowest price", () => {
    const [aggregate] = buildChainAggregates(
      [product([chain("roto", "0.00", "1.50", "1.30")])],
      [item],
    );

    expect(aggregate).toMatchObject({
      min_price: "2.60",
      avg_price: "2.60",
      max_price: "3.00",
    });
  });
});
