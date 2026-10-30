"use client";

import { useMemo } from "react";
import { useGetProductByName } from "@/lib/cijene-api";
import type { IProductListItem } from "@/app/[locale]/products/typings/product-list-price-types";
import { productMatchesFilters } from "@/app/[locale]/products/utils/product-filters";
import sortProductsByRelevance from "@/app/[locale]/products/utils/product-relevance";
import { PRODUCT_SEARCH_LIMIT } from "@/constants/products";
import useFilteredProductPrices from "@/app/[locale]/products/hooks/use-filtered-product-prices";
import useRevealedBatches from "@/app/[locale]/products/hooks/use-revealed-batches";
import { splitIntoBatches } from "@/app/[locale]/products/utils/product-batches";

interface IUseInfiniteProductsOptions {
  /** Resolved chain+location filter (null = unfiltered, empty = no overlap) */
  allowedChains?: string[] | null;
  selectedCategories?: string[];
  selectedBrands?: string[];
  selectedLocations?: string[];
  selectedSourceCities?: string[];
  batchSize?: number;
}

interface IUseInfiniteProductsResult {
  visibleItems: IProductListItem[];
  total: number;
  /** The search filled the API's result cap, so further matches may exist */
  isTruncated: boolean;
  isLoading: boolean;
  error: unknown;
  hasPartialPriceData: boolean;
}

const EMPTY_SELECTION: string[] = [];

export default function useInfiniteProducts(
  q: string,
  options?: IUseInfiniteProductsOptions,
): IUseInfiniteProductsResult {
  const {
    allowedChains = null,
    selectedCategories = EMPTY_SELECTION,
    selectedBrands = EMPTY_SELECTION,
    selectedLocations = EMPTY_SELECTION,
    selectedSourceCities = EMPTY_SELECTION,
    batchSize = 50,
  } = options ?? {};

  // Guard a 0/NaN size, which would make the batching loop never advance.
  const safeBatchSize =
    Number.isInteger(batchSize) && batchSize > 0 ? batchSize : 50;

  // One unfiltered request, filtered client-side, so facet counts match results.
  const { data, isLoading, error } = useGetProductByName({
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

  const batchedItems = useMemo(
    () => splitIntoBatches(filteredItems, safeBatchSize),
    [filteredItems, safeBatchSize],
  );

  const batchKey = [
    q,
    allowedChains?.join(",") ?? "*",
    selectedCategories.join(","),
    selectedBrands.join(","),
    selectedLocations.join(","),
    selectedSourceCities.join(","),
  ].join("\0");
  const batchesToShow = useRevealedBatches(batchKey, batchedItems.length);

  const visibleItems = useMemo(() => {
    return batchedItems.slice(0, batchesToShow).flatMap((batch) => batch);
  }, [batchedItems, batchesToShow]);

  return {
    visibleItems,
    total: filteredItems.length,
    isTruncated,
    isLoading: isLoading || pricesLoading,
    error: error || pricesError,
    hasPartialPriceData: hasPartialError,
  };
}
