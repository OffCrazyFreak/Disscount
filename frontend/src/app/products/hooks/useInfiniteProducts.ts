"use client";

import { useEffect, useMemo, useState } from "react";
import { useGetProductByName } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { productMatchesFilters } from "@/app/products/utils/product-filters";

interface IUseInfiniteProductsOptions {
  /** Comma-separated chain codes forwarded to the API */
  chains?: string;
  /** Set false to hold the search (e.g. filters still resolving or conflicting) */
  enabled?: boolean;
  selectedCategories?: string[];
  selectedBrands?: string[];
  batchSize?: number;
}

interface IUseInfiniteProductsResult {
  visibleProducts: ProductResponse[];
  /** Unfiltered fetched result set (source for filter option lists) */
  allProducts: ProductResponse[];
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
    chains,
    enabled = true,
    selectedCategories = EMPTY_SELECTION,
    selectedBrands = EMPTY_SELECTION,
    batchSize = 50,
  } = options ?? {};

  const { data, isLoading, error } = useGetProductByName(
    {
      q,
      fuzzy: false,
      limit: 100, // TODO: remove limit
      ...(chains ? { chains } : {}),
    },
    { enabled },
  );

  const allProducts = useMemo(() => data?.products || [], [data?.products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0 && selectedBrands.length === 0) {
      return allProducts;
    }

    return allProducts.filter((product) =>
      productMatchesFilters(product, selectedCategories, selectedBrands),
    );
  }, [allProducts, selectedCategories, selectedBrands]);

  const batchedProducts = useMemo(() => {
    const batches: ProductResponse[][] = [];
    for (let i = 0; i < filteredProducts.length; i += batchSize) {
      batches.push(filteredProducts.slice(i, i + batchSize));
    }
    return batches;
  }, [filteredProducts, batchSize]);

  const [batchesToShow, setBatchesToShow] = useState<number>(
    batchedProducts.length > 0 ? 1 : 0,
  );

  // Reset visible batches when query, server filter, or results change
  useEffect(() => {
    setBatchesToShow(batchedProducts.length > 0 ? 1 : 0);
  }, [batchedProducts.length, q, chains]);

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
    allProducts,
    total: filteredProducts.length,
    hasMore: batchesToShow < batchedProducts.length,
    loadMore: () =>
      setBatchesToShow((p) => Math.min(p + 1, batchedProducts.length)),
    isLoading,
    error,
  };
}
