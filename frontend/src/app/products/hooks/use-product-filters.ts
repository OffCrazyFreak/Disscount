"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { readListParam } from "@/utils/generic";
import { normalizeForSearch } from "@/utils/strings";
import {
  canonicalizeSelection,
  normalizeChainCode,
} from "@/app/products/utils/product-filters";
import { resolveAllowedChains } from "@/app/products/utils/allowed-chains";
import useFilterParams, {
  type IFilterParamsResult,
} from "@/app/products/hooks/use-filter-params";
import useSeedPreferredFilters from "@/app/products/hooks/use-seed-preferred-filters";

export type { ProductFilterKey } from "@/app/products/hooks/use-filter-params";

export interface IUseProductFiltersResult extends IFilterParamsResult {
  selectedChains: string[];
  selectedLocations: string[];
  /** Raw upstream city values represented by the selected locations */
  selectedSourceCities: string[];
  selectedCategories: string[];
  selectedBrands: string[];
  activeFilterCount: number;
  /** Chain codes results may appear in (null = unfiltered, [] = no overlap) */
  allowedChains: string[] | null;
  /** False only while a location filter is set and stores are still loading */
  locationsReady: boolean;
  /** Store lookup failure, relevant only while a location filter is selected */
  locationsError: unknown;
}

interface IUseProductFiltersOptions {
  /** Off for a second reader on the same route, so the two cannot both seed */
  seedPreferred?: boolean;
}

/**
 * URL-backed filter state for the products page: shareable and
 * back/forward-safe. Product identity and category/brand facets use the full
 * search response; store-level prices resolve the exact chain/location scope.
 */
export default function useProductFilters({
  seedPreferred = true,
}: IUseProductFiltersOptions = {}): IUseProductFiltersResult {
  const searchParams = useSearchParams();
  const {
    data: locations,
    isLoading: locationsLoading,
    error: locationsError,
  } = useAllLocations();
  const filterParams = useFilterParams();

  useSeedPreferredFilters(seedPreferred);

  // Only these two split on commas, so old shared links still resolve.
  const selectedChains = useMemo(
    () => [
      ...new Set(
        readListParam(searchParams, "chain", { legacyCsv: true }).map(
          normalizeChainCode,
        ),
      ),
    ],
    [searchParams],
  );

  const selectedLocations = useMemo(
    () =>
      canonicalizeSelection(
        readListParam(searchParams, "location", { legacyCsv: true }),
        locations.map((location) => location.name),
      ),
    [searchParams, locations],
  );

  const selectedCategories = useMemo(
    () => readListParam(searchParams, "category"),
    [searchParams],
  );

  const selectedSourceCities = useMemo(() => {
    const selected = new Set(selectedLocations.map(normalizeForSearch));

    return locations
      .filter((location) => selected.has(normalizeForSearch(location.name)))
      .flatMap((location) => location.sourceCities);
  }, [locations, selectedLocations]);

  const selectedBrands = useMemo(
    () => readListParam(searchParams, "brand"),
    [searchParams],
  );

  // An unresolved location filter stays unfiltered rather than matching nothing.
  const allowedChains = useMemo(
    () =>
      selectedLocations.length > 0 && (locationsLoading || locationsError)
        ? null
        : resolveAllowedChains(selectedChains, selectedLocations, locations),
    [
      selectedChains,
      selectedLocations,
      locations,
      locationsLoading,
      locationsError,
    ],
  );

  return {
    selectedChains,
    selectedLocations,
    selectedSourceCities,
    selectedCategories,
    selectedBrands,
    activeFilterCount:
      selectedChains.length +
      selectedLocations.length +
      selectedCategories.length +
      selectedBrands.length,
    allowedChains,
    locationsReady: selectedLocations.length === 0 || !locationsLoading,
    locationsError: selectedLocations.length > 0 ? locationsError : null,
    ...filterParams,
  };
}
