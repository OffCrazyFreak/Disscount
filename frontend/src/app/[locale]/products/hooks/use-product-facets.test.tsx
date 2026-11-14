import { expect, it, vi } from "vitest";
import useProductFacets from "@/app/[locale]/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/[locale]/products/hooks/use-product-filters";
import { renderHookWithProviders } from "@/test/render";

vi.mock("@/lib/cijene-api", () => ({
  useListChains: () => ({ data: { chains: ["konzum"] } }),
}));
vi.mock("@/lib/cijene-api/hooks", () => ({
  useAllLocations: () => ({ data: [] }),
}));
const pages = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      products: [],
      source: "owned",
      facets: {
        chain: { konzum: 240 },
        city: { Split: 130 },
        brand: { brand: 120 },
        category: { food: 110 },
      },
    },
  })),
);
vi.mock("@/lib/cijene-api/use-product-pages", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/cijene-api/use-product-pages")
  >()),
  default: pages,
}));

it("uses complete server facet counts even when the loaded page is empty", () => {
  const filters = {
    selectedChains: ["konzum"],
    selectedLocations: ["Split"],
    selectedSourceCities: ["SPLIT"],
    selectedBrands: ["brand"],
    selectedCategories: ["food"],
  } as IUseProductFiltersResult;
  const { result } = renderHookWithProviders(() =>
    useProductFacets("milk", filters),
  );
  expect(result.current.chains.counts).toEqual({ konzum: 240 });
  expect(result.current.locations.counts).toEqual({ Split: 130 });
  expect(result.current.brands.counts).toEqual({ brand: 120 });
  expect(result.current.categories.counts).toEqual({ food: 110 });
  expect(pages).toHaveBeenCalledWith({
    q: "milk",
    limit: 100,
    chains: "konzum",
    city: "SPLIT",
    brand: "brand",
    category: "food",
    order: "relevance",
  });
});
