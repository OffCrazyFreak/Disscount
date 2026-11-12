"use client";

import { useMemo } from "react";
import { useGetProductByName } from "@/lib/cijene-api";
import type { IProductListItem } from "@/app/[locale]/products/typings/product-list-price-types";
import {
  hasMatchOutsideLocations,
  productMatchesFilters,
} from "@/app/[locale]/products/utils/product-filters";
import sortProductsByRelevance from "@/app/[locale]/products/utils/product-relevance";
import { PRODUCT_SEARCH_LIMIT } from "@/constants/products";
import useFilteredProductPrices from "@/app/[locale]/products/hooks/use-filtered-product-prices";
import { useRevealedItems } from "@/hooks/scroll/use-revealed-items";

interface IUseInfiniteProductsOptions {
  /** Resolved chain+location filter (null = unfiltered, empty = no overlap) */
  allowedChains?: string[] | null;
  /** The chain filter alone, before the location narrows it */
  selectedChains?: string[];
  selectedCategories?: string[];
  selectedBrands?: string[];
  selectedLocations?: string[];
  selectedSourceCities?: string[];
}

interface IUseInfiniteProductsResult {
  visibleItems: IProductListItem[];
  total: number;
  /** The search filled the API's result cap, so further matches may exist */
  isTruncated: boolean;
  isLoading: boolean;
  /** The previous search's results are shown while the new one loads */
  isRefreshing: boolean;
  error: unknown;
  hasPartialPriceData: boolean;
  /** A location filter is set and the search has matches once it is dropped */
  hasMatchesOutsideLocations: boolean;
}

const EMPTY_SELECTION: string[] = [];

// An old "no results" would read as the answer to the new search, so it counts as loading.
function isShowingPreviousEmptyResults(
  isPlaceholderData: boolean,
  itemCount: number,
) {
  return isPlaceholderData && itemCount === 0;
}

export default function useInfiniteProducts(
  q: string,
  options?: IUseInfiniteProductsOptions,
): IUseInfiniteProductsResult {
  const {
    allowedChains = null,
    selectedChains = EMPTY_SELECTION,
    selectedCategories = EMPTY_SELECTION,
    selectedBrands = EMPTY_SELECTION,
    selectedLocations = EMPTY_SELECTION,
    selectedSourceCities = EMPTY_SELECTION,
  } = options ?? {};

  // One unfiltered request, filtered client-side, so facet counts match results.
  const { data, isLoading, isPlaceholderData, error } = useGetProductByName({
    q,
    limit: PRODUCT_SEARCH_LIMIT, // Raising this needs paging upstream: >100 is a 422.
  });

  const allProducts = useMemo(() => data?.products || [], [data?.products]);

  const isTruncated = allProducts.length >= PRODUCT_SEARCH_LIMIT;

  const chainProducts = useMemo(() => {
    if (allowedChains === null) return allProducts;

    return allProducts.filter((product) =>
      productMatchesFilters(
        product,
        allowedChains,
        EMPTY_SELECTION,
        EMPTY_SELECTION,
      ),
    );
  }, [allProducts, allowedChains]);

  // The API returns hits in its own order, so the best match can land anywhere.
  const rankedProducts = useMemo(
    () => sortProductsByRelevance(chainProducts, q),
    [chainProducts, q],
  );

  const {
    items: pricedItems,
    isLoading: pricesLoading,
    error: pricesError,
    hasPartialError,
  } = useFilteredProductPrices({
    products: rankedProducts,
    allowedChains,
    selectedLocations,
    selectedSourceCities,
  });

  const filteredItems = useMemo(() => {
    if (selectedCategories.length === 0 && selectedBrands.length === 0) {
      return pricedItems;
    }

    return pricedItems.filter(({ product }) =>
      productMatchesFilters(product, null, selectedCategories, selectedBrands),
    );
  }, [pricedItems, selectedBrands, selectedCategories]);

  const batchKey = [
    q,
    allowedChains?.join(",") ?? "*",
    selectedCategories.join(","),
    selectedBrands.join(","),
    selectedLocations.join(","),
    selectedSourceCities.join(","),
  ].join("\0");
  const visibleItems = useRevealedItems(filteredItems, batchKey);

  const hasMatchesOutsideLocations = hasMatchOutsideLocations(allProducts, {
    selectedChains,
    selectedLocations,
    selectedCategories,
    selectedBrands,
    isPriceDataPartial: hasPartialError,
  });

  return {
    visibleItems,
    total: filteredItems.length,
    isTruncated,
    isLoading:
      isLoading ||
      pricesLoading ||
      isShowingPreviousEmptyResults(isPlaceholderData, filteredItems.length),
    isRefreshing: isPlaceholderData,
    error: error || pricesError,
    hasPartialPriceData: hasPartialError,
    hasMatchesOutsideLocations,
  };
}
