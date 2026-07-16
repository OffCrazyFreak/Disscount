"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { parseListParam } from "@/utils/generic";

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
  /** Comma-separated chain codes for the API, undefined when unfiltered */
  effectiveChains: string | undefined;
  /** Chain/location filters resolve to an empty chain set: skip the API call */
  isChainConflict: boolean;
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
    () => parseListParam(searchParams.get("chain")),
    [searchParams],
  );
  const selectedLocations = useMemo(
    () => parseListParam(searchParams.get("location")),
    [searchParams],
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

  const { effectiveChains, isChainConflict } = useMemo(() => {
    if (selectedChains.length === 0 && selectedLocations.length === 0) {
      return { effectiveChains: undefined, isChainConflict: false };
    }

    if (selectedLocations.length === 0) {
      return {
        effectiveChains: selectedChains.join(","),
        isChainConflict: false,
      };
    }

    // Location filter resolves via the city -> chains mapping; while stores
    // are loading the search is held disabled through locationsReady instead.
    if (locationsLoading) {
      return { effectiveChains: undefined, isChainConflict: false };
    }

    const locationChains = new Set<string>();
    for (const location of locations) {
      if (selectedLocations.includes(location.name)) {
        location.chains.forEach((chain) => locationChains.add(chain));
      }
    }

    const resolved =
      selectedChains.length > 0
        ? selectedChains.filter((chain) => locationChains.has(chain))
        : [...locationChains];

    if (resolved.length === 0) {
      return { effectiveChains: undefined, isChainConflict: true };
    }

    return { effectiveChains: resolved.join(","), isChainConflict: false };
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
    effectiveChains,
    isChainConflict,
    locationsReady,
  };
}
