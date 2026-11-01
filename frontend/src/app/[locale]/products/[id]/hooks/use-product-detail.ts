"use client";

import { useMemo } from "react";
import cijeneService from "@/lib/cijene-api";
import { useUser } from "@/context/user-context";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import {
  compareProductChains,
  type ProductChainSortMode,
} from "@/app/[locale]/products/utils/product-chain-sort";
import {
  locatePricedStores,
  nearestDistanceByChain,
} from "@/app/[locale]/products/utils/nearest-chain-distance";
import { useDistanceSort } from "@/app/[locale]/products/hooks/use-distance-sort";

/** One product, its prices grouped by chain, and the chain order to show them in */
export function useProductDetail(ean: string) {
  const { user } = useUser();
  const distance = useDistanceSort<ProductChainSortMode>("stores", "stores");

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

  const { origin, stores, sortMode } = distance;
  const distanceByChain = useMemo(
    () =>
      origin && stores
        ? nearestDistanceByChain(
            origin,
            locatePricedStores(pricesData?.store_prices ?? [], stores),
          )
        : undefined,
    [origin, stores, pricesData],
  );

  // Copy first: product.chains is the cached array, and sort mutates.
  const sortedChains = useMemo(
    () =>
      [...(product?.chains ?? [])].sort((a, b) =>
        compareProductChains(a, b, pinnedStoreIds, sortMode, distanceByChain),
      ),
    [product?.chains, pinnedStoreIds, sortMode, distanceByChain],
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
    sortBy: distance.chosen,
    setSortBy: distance.choose,
    distanceState: distance.state,
    distanceByChain,
  };
}
