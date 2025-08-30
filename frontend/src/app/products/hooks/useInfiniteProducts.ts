"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductSearch } from "@/app/products/api/hooks";
import type { ProductResponse } from "@/app/products/api/schemas";

export interface UseInfiniteProductsResult {
  visibleProducts: ProductResponse[];
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  error: unknown;
}

export function useInfiniteProducts(
  q: string,
  batchSize = 50
): UseInfiniteProductsResult {
  const { data: allProducts = [], isLoading, error } = useProductSearch({ q });

  const batchedProducts = useMemo(() => {
    const batches: ProductResponse[][] = [];
    for (let i = 0; i < allProducts.length; i += batchSize) {
      batches.push(allProducts.slice(i, i + batchSize));
    }
    return batches;
  }, [allProducts, batchSize]);

  const [batchesToShow, setBatchesToShow] = useState<number>(
    batchedProducts.length > 0 ? 1 : 0
  );

  // Reset visible batches when query or results change
  useEffect(() => {
    setBatchesToShow(batchedProducts.length > 0 ? 1 : 0);
  }, [batchedProducts.length, q]);

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
    total: allProducts.length,
    hasMore: batchesToShow < batchedProducts.length,
    loadMore: () =>
      setBatchesToShow((p) => Math.min(p + 1, batchedProducts.length)),
    isLoading,
    error,
  };
}

export default useInfiniteProducts;
