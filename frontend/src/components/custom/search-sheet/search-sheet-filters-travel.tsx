"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductFacetSelects from "@/app/products/components/product-facet-selects";
import useProductFacets from "@/app/products/hooks/use-product-facets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";
import {
  FILTER_KEYS,
  type ProductFilterKey,
} from "@/app/products/hooks/use-filter-params";
import SearchSheetClearFilters from "@/components/custom/search-sheet/search-sheet-clear-filters";

type Selection = Record<ProductFilterKey, string[]>;

const EMPTY: Selection = { chain: [], location: [], category: [], brand: [] };

interface ISearchSheetFiltersTravelProps {
  typedQuery: string;
}

/**
 * Off the products list there is no filter state to amend, so a pick and
 * whatever is currently typed travel together in one navigation and a half-typed
 * query survives the trip. This is what the sidebar's filter menu already does.
 */
export default function SearchSheetFiltersTravel({
  typedQuery,
}: ISearchSheetFiltersTravelProps) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>(EMPTY);

  function travel(next: Selection) {
    setSelection(next);

    const params = new URLSearchParams();
    if (typedQuery.trim()) params.set("q", typedQuery.trim());

    // One param per value, since a category or brand may contain a comma.
    FILTER_KEYS.forEach((key) =>
      next[key].forEach((value) => params.append(key, value)),
    );

    router.push(`/products?${params.toString()}`);
  }

  const filters: IUseProductFiltersResult = {
    selectedChains: selection.chain,
    selectedLocations: selection.location,
    selectedCategories: selection.category,
    selectedBrands: selection.brand,
    activeFilterCount: FILTER_KEYS.reduce(
      (total, key) => total + selection[key].length,
      0,
    ),
    allowedChains: null,
    locationsReady: true,
    setFilter: (key, values) => travel({ ...selection, [key]: values }),
    setFilters: (updates) => travel({ ...selection, ...updates }),
    clearFilters: () => setSelection(EMPTY),
  };

  // Deliberately empty: no request fires, and another page's q (the map's is
  // store names) can never end up facetting products.
  const facets = useProductFacets("", filters);

  return (
    <>
      <ProductFacetSelects facets={facets} filters={filters} layout="stack" />

      <SearchSheetClearFilters
        disabled={filters.activeFilterCount === 0}
        onClear={filters.clearFilters}
      />
    </>
  );
}
