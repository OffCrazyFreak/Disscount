import { describe, expect, it } from "vitest";

import { productEanFromPath, shoppingListIdFromPath } from "@/utils/routes";

describe("productEanFromPath", () => {
  it("reads the EAN from a product page, with or without a trailing slash", () => {
    expect(productEanFromPath("/products/3850104000123")).toBe("3850104000123");
    expect(productEanFromPath("/products/3850104000123/")).toBe(
      "3850104000123",
    );
  });

  it("ignores the product index and nested pages", () => {
    expect(productEanFromPath("/products")).toBeNull();
    expect(productEanFromPath("/products/123/prices")).toBeNull();
  });

  it("returns null for a malformed escape instead of throwing", () => {
    expect(productEanFromPath("/products/%E0%A4%A")).toBeNull();
  });
});

describe("shoppingListIdFromPath", () => {
  it("decodes the list id", () => {
    expect(shoppingListIdFromPath("/shopping-lists/a%20b")).toBe("a b");
  });
});
