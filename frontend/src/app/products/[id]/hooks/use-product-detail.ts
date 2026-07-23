"use client";

import { useMemo, useState } from "react";
import cijeneService from "@/lib/cijene-api";
import { useUser } from "@/context/user-context";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import {
  compareProductChains,
  type ProductChainSortMode,
} from "@/app/products/utils/product-chain-sort";

/** One product, its prices grouped by chain, and the chain order to show them in */
export function useProductDetail(ean: string) {
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<ProductChainSortMode>("stores");

  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = cijeneService.useGetProductByEan({ ean });

  const {
    data: pricesData,
    isLoading: pricesLoading,
    error: pricesError,
    dataUpdatedAt: pricesUpdatedAt,
  } = cijeneService.useGetPrices({ eans: ean });

  const pricesByChain = useMemo(() => {
    const grouped: Record<string, StorePrice[]> = {};

    for (const price of pricesData?.store_prices ?? []) {
      grouped[price.chain] = [...(grouped[price.chain] ?? []), price];
    }

    return grouped;
  }, [pricesData]);

  const pinnedStoreIds = useMemo(
    () => user?.pinnedStores?.map((store) => store.storeApiId) ?? [],
    [user?.pinnedStores],
  );

  // Copies first: product.chains is React Query's cached array, so sorting it
  // in place would reorder the cache from inside a render.
  const sortedChains = useMemo(
    () =>
      [...(product?.chains ?? [])].sort((a, b) =>
        compareProductChains(a, b, pinnedStoreIds, sortBy),
      ),
    [product?.chains, pinnedStoreIds, sortBy],
  );

  return {
    product,
    productLoading,
    productError,
    pricesByChain,
    pricesLoading,
    pricesError,
    pricesUpdatedAt,
    sortedChains,
    sortBy,
    setSortBy,
  };
}
