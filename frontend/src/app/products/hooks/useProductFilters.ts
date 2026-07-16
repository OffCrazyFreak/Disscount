"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { parseListParam } from "@/utils/generic";
import { normalizeForSearch } from "@/utils/strings";
import {
  canonicalizeSelection,
  normalizeChainCode,
} from "@/app/products/utils/product-filters";

export type ProductFilterKey = "chain" | "location" | "category" | "brand";

const FILTER_KEYS: ProductFilterKey[] = [
  "chain",
  "location",
  "category",
  "brand",
];

export interface IUseProductFiltersResult {
  selectedChains: string[];
  selectedLocations: string[];
  selectedCategories: string[];
  selectedBrands: string[];
  setFilter: (key: ProductFilterKey, values: string[]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  /**
   * Resolved chain+location filter for client-side matching:
   * null = unfiltered, empty array = selections with no overlap
   */
  allowedChains: string[] | null;
  /** False only while a location filter is set and stores are still loading */
  locationsReady: boolean;
}

/**
 * URL-backed filter state for the products page. All state lives in the
 * query string (shareable, back/forward-safe); chain + location resolve to
 * a server-side `chains` param, category + brand filter client-side.
 */
export default function useProductFilters(): IUseProductFiltersResult {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const { data: locations, isLoading: locationsLoading } = useAllLocations();

  const selectedChains = useMemo(
    () => [
      ...new Set(parseListParam(searchParams.get("chain")).map(normalizeChainCode)),
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

  const locationsReady = selectedLocations.length === 0 || !locationsLoading;

  const allowedChains = useMemo<string[] | null>(() => {
    if (selectedChains.length === 0 && selectedLocations.length === 0) {
      return null;
    }

    if (selectedLocations.length === 0) return selectedChains;

    // Location filter resolves via the city -> chains mapping; while stores
    // are loading the results are held back through locationsReady instead.
    if (locationsLoading) return null;

    const selectedLocationKeys = new Set(
      selectedLocations.map(normalizeForSearch),
    );
    const locationChains = new Set<string>();
    for (const location of locations) {
      if (selectedLocationKeys.has(normalizeForSearch(location.name))) {
        location.chains.forEach((chain) =>
          locationChains.add(normalizeChainCode(chain)),
        );
      }
    }

    // Empty result = selections with no overlap -> matches nothing
    return selectedChains.length > 0
      ? selectedChains.filter((chain) => locationChains.has(chain))
      : [...locationChains];
  }, [selectedChains, selectedLocations, locations, locationsLoading]);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, pathname, router],
  );

  const setFilter = useCallback(
    (key: ProductFilterKey, values: string[]) => {
      replaceParams((params) => {
        if (values.length > 0) {
          params.set(key, values.join(","));
        } else {
          params.delete(key);
        }
      });
    },
    [replaceParams],
  );

  const clearFilters = useCallback(() => {
    replaceParams((params) => {
      FILTER_KEYS.forEach((key) => params.delete(key));
    });
  }, [replaceParams]);

  const activeFilterCount =
    selectedChains.length +
    selectedLocations.length +
    selectedCategories.length +
    selectedBrands.length;

  return {
    selectedChains,
    selectedLocations,
    selectedCategories,
    selectedBrands,
    setFilter,
    clearFilters,
    activeFilterCount,
    allowedChains,
    locationsReady,
  };
}
