"use client";

import { useEffect, useMemo, useState } from "react";
import { useGetProductByName } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { productMatchesFilters } from "@/app/products/utils/product-filters";
import { PRODUCT_SEARCH_LIMIT } from "@/constants/products";

interface IUseInfiniteProductsOptions {
  /** Resolved chain+location filter (null = unfiltered, empty = no overlap) */
  allowedChains?: string[] | null;
  selectedCategories?: string[];
  selectedBrands?: string[];
  batchSize?: number;
}

interface IUseInfiniteProductsResult {
  visibleProducts: ProductResponse[];
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  error: unknown;
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
    batchSize = 50,
  } = options ?? {};

  // Guard a 0/NaN size, which would make the batching loop never advance.
  const safeBatchSize =
    Number.isInteger(batchSize) && batchSize > 0 ? batchSize : 50;

  // Single unfiltered request per query; all filters apply client-side over
  // this same dataset the facet options are computed from, so option counts
  // always match the visible results.
  const { data, isLoading, error } = useGetProductByName({
    q,
    fuzzy: false,
    limit: PRODUCT_SEARCH_LIMIT, // TODO: remove limit
  });

  const allProducts = useMemo(() => data?.products || [], [data?.products]);

  const filteredProducts = useMemo(() => {
    const unfiltered =
      allowedChains === null &&
      selectedCategories.length === 0 &&
      selectedBrands.length === 0;
    if (unfiltered) return allProducts;

    return allProducts.filter((product) =>
      productMatchesFilters(
        product,
        allowedChains,
        selectedCategories,
        selectedBrands,
      ),
    );
  }, [allProducts, allowedChains, selectedCategories, selectedBrands]);

  const batchedProducts = useMemo(() => {
    const batches: ProductResponse[][] = [];
    for (let i = 0; i < filteredProducts.length; i += safeBatchSize) {
      batches.push(filteredProducts.slice(i, i + safeBatchSize));
    }
    return batches;
  }, [filteredProducts, safeBatchSize]);

  const [batchesToShow, setBatchesToShow] = useState<number>(
    batchedProducts.length > 0 ? 1 : 0,
  );

  // Depends on the batches rather than their count, so a filter change that
  // happens to yield the same number of batches still resets the depth.
  useEffect(() => {
    setBatchesToShow(batchedProducts.length > 0 ? 1 : 0);
  }, [batchedProducts, q]);

  // Load more when user scrolls near bottom of page
  useEffect(() => {
    if (batchesToShow >= batchedProducts.length) return;

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const viewport = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollY + viewport >= fullHeight - 10000) {
        setBatchesToShow((prev) => Math.min(prev + 1, batchedProducts.length));
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [batchesToShow, batchedProducts.length]);

  const visibleProducts = useMemo(() => {
    return batchedProducts.slice(0, batchesToShow).flatMap((b) => b);
  }, [batchedProducts, batchesToShow]);

  return {
    visibleProducts,
    total: filteredProducts.length,
    hasMore: batchesToShow < batchedProducts.length,
    loadMore: () =>
      setBatchesToShow((p) => Math.min(p + 1, batchedProducts.length)),
    isLoading,
    error,
  };
}
