"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { readListParam } from "@/utils/generic";
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
  selectedCategories: string[];
  selectedBrands: string[];
  activeFilterCount: number;
  /** Chain codes results may appear in (null = unfiltered, [] = no overlap) */
  allowedChains: string[] | null;
  /** False only while a location filter is set and stores are still loading */
  locationsReady: boolean;
}

/**
 * URL-backed filter state for the products page: shareable and
 * back/forward-safe. All four filters apply client-side, since the cijene
 * search endpoint only accepts `q`.
 */
export default function useProductFilters(): IUseProductFiltersResult {
  const searchParams = useSearchParams();
  const { data: locations, isLoading: locationsLoading } = useAllLocations();
  const filterParams = useFilterParams();

  useSeedPreferredFilters();

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

  const selectedBrands = useMemo(
    () => readListParam(searchParams, "brand"),
    [searchParams],
  );

  // An unresolved location filter stays unfiltered rather than matching nothing.
  const allowedChains = useMemo(
    () =>
      selectedLocations.length > 0 && locationsLoading
        ? null
        : resolveAllowedChains(selectedChains, selectedLocations, locations),
    [selectedChains, selectedLocations, locations, locationsLoading],
  );

  return {
    selectedChains,
    selectedLocations,
    selectedCategories,
    selectedBrands,
    activeFilterCount:
      selectedChains.length +
      selectedLocations.length +
      selectedCategories.length +
      selectedBrands.length,
    allowedChains,
    locationsReady: selectedLocations.length === 0 || !locationsLoading,
    ...filterParams,
  };
}
