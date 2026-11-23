import { describe, expect, it } from "vitest";

import { buildChainAggregates } from "@/features/shopping-lists/detail/utils/stores/store-chain-aggregate";
import type { ShoppingListItemDto } from "@/lib/api/types";
import {
  productResponseSchema,
  type ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { chain, product, wireProduct } from "@/test/fixtures/price-fixtures";

const item = { ean: "1", amount: 2 } as ShoppingListItemDto;

/** Sent through the price schema, which is where a zero price is dealt with. */
function parsedProduct(chains: ChainProductResponse[]) {
  return productResponseSchema.parse(wireProduct(product(chains)));
}

describe("buildChainAggregates", () => {
  it("leaves out a chain whose only price is zero", () => {
    const aggregates = buildChainAggregates(
      [parsedProduct([chain("konzum", 1.2), chain("roto", 0)])],
      [item],
    );

    expect(aggregates.map((aggregate) => aggregate.chain)).toEqual(["konzum"]);
    expect(aggregates[0].avg_price).toBe(2.4);
  });

  it("falls back to the average for a zero lowest price", () => {
    const [aggregate] = buildChainAggregates(
      [parsedProduct([chain("roto", 0, 1.5, 1.3)])],
      [item],
    );

    expect(aggregate).toMatchObject({
      min_price: 2.6,
      avg_price: 2.6,
      max_price: 3,
    });
  });
});
