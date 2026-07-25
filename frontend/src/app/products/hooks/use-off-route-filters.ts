"use client";

import { useRouter } from "next/navigation";
import { useSearchSheet } from "@/context/search-sheet-context";
import type { ProductFilterKey } from "@/app/products/hooks/use-filter-params";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

const PRODUCTS_ROUTE = "/products";

/**
 * Off the products list there is no filter state in the URL to amend, so a pick
 * and whatever is currently typed travel together in one navigation to the list.
 * Nothing reads as selected, because nothing is: this is a way in, not a state.
 */
export default function useOffRouteFilters(): IUseProductFiltersResult {
  const router = useRouter();
  const { queryDraft } = useSearchSheet();

  function setFilters(updates: Partial<Record<ProductFilterKey, string[]>>) {
    const params = new URLSearchParams();
    const query = queryDraft.trim();

    if (query) params.set("q", query);

    for (const [key, values] of Object.entries(updates))
      values?.forEach((value) => params.append(key, value));

    router.push(`${PRODUCTS_ROUTE}?${params}`);
  }

  return {
    selectedChains: [],
    selectedLocations: [],
    selectedCategories: [],
    selectedBrands: [],
    activeFilterCount: 0,
    allowedChains: null,
    locationsReady: true,
    setFilter: (key, values) => setFilters({ [key]: values }),
    setFilters,
    clearFilters: () => {},
  };
}
