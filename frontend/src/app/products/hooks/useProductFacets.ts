"use client";

import { useMemo } from "react";
import { useGetProductByName, useListChains } from "@/lib/cijene-api";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";
import { canonicalizeSelection } from "@/app/products/utils/product-filters";
import {
  computeProductFacets,
  type IFacetOption,
} from "@/app/products/utils/product-facets";
import type { IUseProductFiltersResult } from "@/app/products/hooks/useProductFilters";

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
  fallbackCounts?: Record<string, number>,
): IFacetSelect {
  const values = facetOptions
    ? facetOptions.map((option) => option.value)
    : fallbackValues;

  const selected = canonicalizeSelection(selectedRaw, values);
  const known = new Set(values);
  const options = [...values, ...selected.filter((v) => !known.has(v))];
  const counts = facetOptions
    ? Object.fromEntries(facetOptions.map((o) => [o.value, o.count]))
    : fallbackCounts;

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

  // Same request as the results list (shared React Query cache entry):
  // facets and visible products always derive from one dataset.
  const { data: facetData } = useGetProductByName({
    q: query,
    fuzzy: false,
    limit: 100,
  });

  return useMemo(() => {
    const facets =
      query && facetData
        ? computeProductFacets(facetData.products, locations ?? [], {
            chains: filters.selectedChains,
            locations: filters.selectedLocations,
            categories: filters.selectedCategories,
            brands: filters.selectedBrands,
          })
        : null;

    const allLocations = [...(locations ?? [])].sort((a, b) =>
      compareHr(a.name, b.name),
    );

    const chains = toFacetSelect(
      facets?.chains ?? null,
      chainsData?.chains ?? [],
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
        Object.fromEntries(
          allLocations.map((location) => [location.name, location.storeCount]),
        ),
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
