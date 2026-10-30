import { describe, expect, it } from "vitest";

import { countLocations } from "@/app/[locale]/products/utils/facets/facet-counters";
import type {
  IFacetQuery,
  IIndexedProduct,
} from "@/app/[locale]/products/utils/facets/types";

function product(chains: string[], categories: string[] = []): IIndexedProduct {
  return {
    chainCodes: new Set(chains),
    categories: new Map(categories.map((c) => [c, c])),
    brands: new Map(),
  };
}

function query(overrides: Partial<IFacetQuery>): IFacetQuery {
  return {
    indexed: [],
    locations: [],
    selectedChains: new Set(),
    selectedCategories: new Set(),
    selectedBrands: new Set(),
    selectedLocationChains: null,
    ...overrides,
  };
}

const locations = [
  { name: "Zagreb", chains: new Set(["konzum", "spar"]) },
  { name: "Split", chains: new Set(["lidl"]) },
  { name: "Osijek", chains: new Set(["plodine"]) },
];

describe("countLocations", () => {
  it("counts a product once per city that stocks any of its chains, keeping empty cities", () => {
    const result = countLocations(
      query({
        locations,
        indexed: [product(["konzum", "spar"]), product(["lidl", "spar"])],
      }),
    );

    expect(result).toEqual([
      { value: "Osijek", count: 0 },
      { value: "Split", count: 1 },
      { value: "Zagreb", count: 2 },
    ]);
  });

  it("only counts chains the user selected", () => {
    const result = countLocations(
      query({
        locations,
        indexed: [product(["konzum", "lidl"])],
        selectedChains: new Set(["lidl"]),
      }),
    );

    expect(result).toEqual([
      { value: "Osijek", count: 0 },
      { value: "Split", count: 1 },
      { value: "Zagreb", count: 0 },
    ]);
  });

  it("skips products that fail the other facets", () => {
    const result = countLocations(
      query({
        locations,
        indexed: [
          product(["konzum"], ["milk"]),
          product(["konzum"], ["bread"]),
        ],
        selectedCategories: new Set(["milk"]),
      }),
    );

    expect(result.find((option) => option.value === "Zagreb")?.count).toBe(1);
  });
});
