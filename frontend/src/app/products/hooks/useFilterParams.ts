"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ProductFilterKey = "chain" | "location" | "category" | "brand";

export const FILTER_KEYS: ProductFilterKey[] = [
  "chain",
  "location",
  "category",
  "brand",
];

export interface IFilterParamsResult {
  setFilter: (key: ProductFilterKey, values: string[]) => void;
  /** Writes several filters in one URL update (a per-key loop would race) */
  setFilters: (updates: Partial<Record<ProductFilterKey, string[]>>) => void;
  clearFilters: () => void;
}

/** Writes filter values to the query string, preserving `q` and other params */
export default function useFilterParams(): IFilterParamsResult {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

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

  const setFilters = useCallback(
    (updates: Partial<Record<ProductFilterKey, string[]>>) => {
      replaceParams((params) => {
        for (const [key, values] of Object.entries(updates)) {
          // One param per value, since a category or brand may itself contain
          // a comma and would otherwise read back as two filters.
          params.delete(key);
          values?.forEach((value) => params.append(key, value));
        }
      });
    },
    [replaceParams],
  );

  const setFilter = useCallback(
    (key: ProductFilterKey, values: string[]) => setFilters({ [key]: values }),
    [setFilters],
  );

  const clearFilters = useCallback(() => {
    replaceParams((params) => FILTER_KEYS.forEach((key) => params.delete(key)));
  }, [replaceParams]);

  return { setFilter, setFilters, clearFilters };
}
