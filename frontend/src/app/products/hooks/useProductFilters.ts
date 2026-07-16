"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { parseListParam } from "@/utils/generic";
import {
  canonicalizeSelection,
  normalizeChainCode,
} from "@/app/products/utils/product-filters";
import { resolveAllowedChains } from "@/app/products/utils/allowed-chains";
import useFilterParams, {
  type IFilterParamsResult,
} from "@/app/products/hooks/useFilterParams";
import useSeedPreferredFilters from "@/app/products/hooks/useSeedPreferredFilters";

export type { ProductFilterKey } from "@/app/products/hooks/useFilterParams";

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

  const selectedChains = useMemo(
    () => [
      ...new Set(
        parseListParam(searchParams.get("chain")).map(normalizeChainCode),
      ),
    ],
    [searchParams],
  );

  const selectedLocations = useMemo(
    () =>
      canonicalizeSelection(
        parseListParam(searchParams.get("location")),
        locations.map((location) => location.name),
      ),
    [searchParams, locations],
  );

  const selectedCategories = useMemo(
    () => parseListParam(searchParams.get("category")),
    [searchParams],
  );

  const selectedBrands = useMemo(
    () => parseListParam(searchParams.get("brand")),
    [searchParams],
  );

  // Results are held back through locationsReady while stores load, so an
  // unresolved location filter stays unfiltered instead of matching nothing.
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
