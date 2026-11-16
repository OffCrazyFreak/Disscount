import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import useProductFilters from "@/app/[locale]/products/hooks/use-product-filters";
import { productPageParams } from "@/lib/cijene-api/use-product-pages";
import useProductFacets from "@/app/[locale]/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/[locale]/products/hooks/use-product-filters";
import { renderHookWithProviders } from "@/test/render";
import { server } from "@/test/msw-server";

vi.mock("@/lib/cijene-api", () => ({
  useListChains: () => ({ data: { chains: ["konzum", "spar"] } }),
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
const realPages = vi.hoisted(() => ({
  hook: undefined as unknown as (...args: unknown[]) => unknown,
}));
vi.mock("@/lib/cijene-api/use-product-pages", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/cijene-api/use-product-pages")>();
  realPages.hook = actual.default as (...args: unknown[]) => unknown;

  return { ...actual, default: pages };
});

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
    city: ["SPLIT"],
    brand: ["brand"],
    category: ["food"],
    order: "relevance",
  });
});

it("resolves a raw city alias to its existing label and complete API scope", () => {
  selectionState.location = "6C KRK";
  const { result } = renderHookWithProviders(() => useProductFilters());
  expect(result.current.selectedLocations).toEqual(["Krk"]);
  expect(result.current.selectedSourceCities).toEqual(["6C KRK", "KRK"]);
  expect(productPageParams("milk", result.current).city).toEqual([
    "6C KRK",
    "KRK",
  ]);
});
it("retains an unresolved city filter instead of widening to nationwide", () => {
  selectionState.location = "Unlisted city";
  const { result } = renderHookWithProviders(() => useProductFilters());
  expect(productPageParams("milk", result.current).city).toEqual([
    "Unlisted city",
  ]);
});

function chainRow(chain: string) {
  return {
    chain,
    code: "1",
    name: "Mlijeko",
    brand: "Dukat",
    category: "Mlijeko",
    unit: "l",
    quantity: "1",
    min_price: "1.00",
    max_price: "1.20",
    avg_price: "1.10",
    price_date: "2026-11-14",
  };
}

it("counts every chain on public search and reuses its one answer per query", async () => {
  pages.mockImplementation(realPages.hook as never);
  let requests = 0;
  server.use(
    http.get("*/api/cijene/products", () => {
      requests += 1;
      return HttpResponse.json({
        products: [
          {
            ean: "both",
            name: "Mlijeko",
            brand: "Dukat",
            quantity: "1",
            unit: "l",
            chains: [chainRow("konzum"), chainRow("spar")],
          },
          {
            ean: "spar-only",
            name: "Mlijeko",
            brand: "Dukat",
            quantity: "1",
            unit: "l",
            chains: [chainRow("spar")],
          },
        ],
      });
    }),
  );
  let filters = {
    selectedChains: [] as string[],
    selectedLocations: [],
    selectedSourceCities: [],
    selectedBrands: [],
    selectedCategories: [],
  } as unknown as IUseProductFiltersResult;
  const { result, rerender } = renderHookWithProviders(() =>
    useProductFacets("mlijeko", filters),
  );
  await waitFor(() =>
    expect(result.current.chains.counts).toEqual({ konzum: 1, spar: 2 }),
  );

  filters = { ...filters, selectedChains: ["konzum"] };
  rerender();
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(result.current.chains.counts).toEqual({ konzum: 1, spar: 2 });
  expect(result.current.chains.selected).toEqual(["konzum"]);
  expect(requests).toBe(1);
  pages.mockReset();
});
