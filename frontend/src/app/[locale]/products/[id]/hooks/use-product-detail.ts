"use client";

import { useMemo } from "react";
import cijeneService from "@/lib/cijene-api";
import { useUser } from "@/context/user-context";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import {
  compareProductChains,
  type ProductChainSortMode,
} from "@/app/[locale]/products/utils/product-chain-sort";
import { useDistanceSort } from "@/hooks/use-distance-sort";

// One array for every render, so the distance memo is not rebuilt each time.
const NO_PRICES: StorePrice[] = [];

/** One product, its prices grouped by chain, and the chain order to show them in */
export function useProductDetail(ean: string) {
  const { user } = useUser();
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

  // Prices still loading count as locating; failed prices locate nothing.
  const distance = useDistanceSort<ProductChainSortMode>("stores", "stores", {
    pricedStores: pricesData?.store_prices ?? (pricesError ? NO_PRICES : null),
  });
  const { sortMode, distanceByChain } = distance;

  const pinnedStoreIds = useMemo(
    () => user?.pinnedStores?.map((store) => store.storeApiId) ?? [],
    [user?.pinnedStores],
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
    distanceOrigin: distance.origin,
    distanceTowns: distance.towns,
    sortFromTown: distance.chooseTown,
    shownDistances: distance.shownDistances,
  };
}
