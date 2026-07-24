"use client";

import { useMemo } from "react";
import { useGetProductByName, useListChains } from "@/lib/cijene-api";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";
import {
  canonicalizeSelection,
  normalizeChainCode,
} from "@/app/products/utils/product-filters";
import { PRODUCT_SEARCH_LIMIT } from "@/constants/products";
import {
  computeProductFacets,
  type IFacetOption,
} from "@/app/products/utils/product-facets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

export interface IFacetSelect {
  options: string[];
  selected: string[];
  counts?: Record<string, number>;
  disabled: boolean;
}

export interface IProductFacetSelects {
  chains: IFacetSelect;
  locations: IFacetSelect;
  categories: IFacetSelect;
  brands: IFacetSelect;
}

/** Selected values stay visible/removable even when no longer in the options */
function toFacetSelect(
  facetOptions: IFacetOption[] | null,
  fallbackValues: string[],
  selectedRaw: string[],
): IFacetSelect {
  const values = facetOptions
    ? facetOptions.map((option) => option.value)
    : fallbackValues;

  const selected = canonicalizeSelection(selectedRaw, values);
  const known = new Set(values);
  const missing = selected.filter((value) => !known.has(value));
  const options = [...values, ...missing];

  // A selected value that fell out of the universe still shows a (0) count.
  const counts = facetOptions
    ? Object.fromEntries([
        ...facetOptions.map((o): [string, number] => [o.value, o.count]),
        ...missing.map((value): [string, number] => [value, 0]),
      ])
    : undefined;

  return {
    options,
    selected,
    counts,
    disabled: options.length === 0 && selected.length === 0,
  };
}

/**
 * Per-facet dropdown models for the filter bar. With an active query the
 * options come from faceting the (unfiltered) search results; without one
 * they fall back to the full chain/location lists.
 */
export default function useProductFacets(
  query: string,
  filters: IUseProductFiltersResult,
): IProductFacetSelects {
  const { data: chainsData } = useListChains();
  const { data: locations } = useAllLocations();

  // Same request as the results list, so both derive from one cache entry.
  const { data: facetData } = useGetProductByName({
    q: query,
    fuzzy: false,
    limit: PRODUCT_SEARCH_LIMIT,
  });

  return useMemo(() => {
    const chainUniverse = (chainsData?.chains ?? []).map(normalizeChainCode);

    const facets =
      query && facetData
        ? computeProductFacets(
            facetData.products,
            locations ?? [],
            {
              chains: filters.selectedChains,
              locations: filters.selectedLocations,
              categories: filters.selectedCategories,
              brands: filters.selectedBrands,
            },
            chainUniverse,
          )
        : null;

    const allLocations = [...(locations ?? [])].sort((a, b) =>
      compareHr(a.name, b.name),
    );

    const chains = toFacetSelect(
      facets?.chains ?? null,
      chainUniverse,
      filters.selectedChains,
    );
    chains.options = [...chains.options].sort((a, b) =>
      compareHr(getChainLabel(a), getChainLabel(b)),
    );

    return {
      chains,
      locations: toFacetSelect(
        facets?.locations ?? null,
        allLocations.map((location) => location.name),
        filters.selectedLocations,
      ),
      categories: toFacetSelect(
        facets?.categories ?? null,
        [],
        filters.selectedCategories,
      ),
      brands: toFacetSelect(facets?.brands ?? null, [], filters.selectedBrands),
    };
  }, [
    query,
    facetData,
    locations,
    chainsData,
    filters.selectedChains,
    filters.selectedLocations,
    filters.selectedCategories,
    filters.selectedBrands,
  ]);
}
