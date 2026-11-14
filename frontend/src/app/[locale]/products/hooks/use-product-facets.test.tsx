import { expect, it, vi } from "vitest";
import useProductFilters from "@/app/[locale]/products/hooks/use-product-filters";
import { productPageParams } from "@/lib/cijene-api/use-product-pages";
import useProductFacets from "@/app/[locale]/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/[locale]/products/hooks/use-product-filters";
import { renderHookWithProviders } from "@/test/render";

vi.mock("@/lib/cijene-api", () => ({
  useListChains: () => ({ data: { chains: ["konzum"] } }),
}));
const selectionState = vi.hoisted(() => ({ location: "6C KRK" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams({ location: selectionState.location }),
}));
vi.mock("@/lib/cijene-api/hooks", () => ({
  useAllLocations: () => ({
    data: [
      {
        name: "Krk",
        sourceCities: ["6C KRK", "KRK"],
        chains: ["konzum"],
        storeCount: 2,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/app/[locale]/products/hooks/use-filter-params", () => ({
  default: () => ({ setFilter: vi.fn(), clearFilters: vi.fn() }),
}));
vi.mock("@/app/[locale]/products/hooks/use-seed-preferred-filters", () => ({
  default: vi.fn(),
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

it("resolves a raw city alias to its existing label and complete API scope", () => {
  selectionState.location = "6C KRK";
  const { result } = renderHookWithProviders(() => useProductFilters());
  expect(result.current.selectedLocations).toEqual(["Krk"]);
  expect(result.current.selectedSourceCities).toEqual(["6C KRK", "KRK"]);
  expect(productPageParams("milk", result.current).city).toBe("6C KRK,KRK");
});
it("retains an unresolved city filter instead of widening to nationwide", () => {
  selectionState.location = "Unlisted city";
  const { result } = renderHookWithProviders(() => useProductFilters());
  expect(productPageParams("milk", result.current).city).toBe("Unlisted city");
});
