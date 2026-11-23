import { describe, expect, it } from "vitest";

import { productBreadcrumbSteps } from "@/app/[locale]/products/[id]/utils/product-breadcrumbs";

const INPUT = {
  ean: "3850102123456",
  productName: "Dukat svježe mlijeko 2,8% 1 l",
  homeLabel: "Početna",
  productsLabel: "Proizvodi",
};

describe("productBreadcrumbSteps", () => {
  it("leads through the product's category to the product", () => {
    expect(
      productBreadcrumbSteps({
        ...INPUT,
        category: { slug: "mlijeko", name: "Mlijeko" },
      }),
    ).toEqual([
      { label: "Početna", path: "/" },
      { label: "Proizvodi", path: "/products" },
      { label: "Mlijeko", path: "/categories/mlijeko" },
      { label: INPUT.productName, path: "/products/3850102123456" },
    ]);
  });

  it("skips the category step when the product has none", () => {
    const steps = productBreadcrumbSteps({ ...INPUT, category: null });

    expect(steps.map((step) => step.path)).toEqual([
      "/",
      "/products",
      "/products/3850102123456",
    ]);
  });
});
