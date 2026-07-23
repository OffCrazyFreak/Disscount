"use client";

import { useEffect } from "react";
import { useGetProductByName } from "@/lib/cijene-api";
import {
  getProductBrands,
  getProductCategories,
} from "@/app/products/utils/product-filters";
import { normalizeForSearch } from "@/utils/strings";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";
import { PRODUCT_SEARCH_LIMIT } from "@/constants/products";

function collectValues(
  products: ProductResponse[],
  pick: (product: ProductResponse) => string[],
): Set<string> {
  const keys = new Set<string>();

  for (const product of products) {
    for (const value of pick(product)) keys.add(normalizeForSearch(value));
  }

  return keys;
}

function keepAvailable(selected: string[], available: Set<string>): string[] {
  return selected.filter((value) => available.has(normalizeForSearch(value)));
}

/**
 * Drops category/brand selections missing from the current search results.
 * Chain/location survive: they come from user preferences and stay meaningful
 * across searches.
 */
export default function usePruneStaleFilters(
  query: string,
  filters: IUseProductFiltersResult,
): void {
  // Same request (and cache entry) as the results list and the facets
  const { data } = useGetProductByName({
    q: query,
    fuzzy: false,
    limit: PRODUCT_SEARCH_LIMIT,
  });

  const { selectedCategories, selectedBrands, setFilters } = filters;

  useEffect(() => {
    if (!query || !data) return;

    // A truncated set would prune filters matching products we never fetched.
    if (data.products.length >= PRODUCT_SEARCH_LIMIT) return;

    const categories = keepAvailable(
      selectedCategories,
      collectValues(data.products, getProductCategories),
    );
    const brands = keepAvailable(
      selectedBrands,
      collectValues(data.products, getProductBrands),
    );

    const staleCategories = categories.length !== selectedCategories.length;
    const staleBrands = brands.length !== selectedBrands.length;
    if (!staleCategories && !staleBrands) return;

    setFilters({
      ...(staleCategories && { category: categories }),
      ...(staleBrands && { brand: brands }),
    });
  }, [query, data, selectedCategories, selectedBrands, setFilters]);
}
