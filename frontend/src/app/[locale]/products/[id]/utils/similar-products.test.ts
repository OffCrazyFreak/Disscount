import { describe, expect, it } from "vitest";

import {
  SIMILAR_PRODUCT_LIMIT,
  similarProducts,
} from "@/app/[locale]/products/[id]/utils/similar-products";

function item(ean: string, name: string | null = `Mlijeko ${ean}`) {
  return { ean, name, brand: null };
}

describe("similarProducts", () => {
  it("leaves out the product the page is about", () => {
    const eans = similarProducts([item("1"), item("2"), item("3")], "2").map(
      (product) => product.ean,
    );

    expect(eans).toEqual(["1", "3"]);
  });

  it("keeps at most eight, in the backend's order", () => {
    const items = Array.from({ length: 24 }, (_, index) => item(`${index}`));

    const similar = similarProducts(items, "nope");

    expect(similar).toHaveLength(SIMILAR_PRODUCT_LIMIT);
    expect(similar[0].ean).toBe("0");
  });

  it("skips a product with no name to link by", () => {
    expect(similarProducts([item("1", null), item("2")], "x")).toEqual([
      item("2"),
    ]);
  });
});
