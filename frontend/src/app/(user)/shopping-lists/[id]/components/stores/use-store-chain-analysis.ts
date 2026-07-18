"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import cijeneService, { productByEanQueryKey } from "@/lib/cijene-api";
import { ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  compareStoreChains,
  type StoreOptimizeMode,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import {
  buildChainAggregates,
  findCompleteStoresAnalysis,
  countCheapestByChain,
  findHighestPriceStores,
  computeAbsolutePrices,
} from "@/app/(user)/shopping-lists/[id]/components/stores/store-chain-analysis-utils";

interface IUseStoreChainAnalysisParams {
  shoppingList: ShoppingListDto;
  pinnedStores: PinnedStoreDto[] | null | undefined;
  optimizeBy: StoreOptimizeMode;
}

export function useStoreChainAnalysis({
  shoppingList,
  pinnedStores,
  optimizeBy,
}: IUseStoreChainAnalysisParams) {
  // Optimise the store comparison over the products still to buy: items already
  // ticked off as bought are excluded from every store metric below.
  const activeItems = useMemo(
    () => (shoppingList.items ?? []).filter((item) => !item.isChecked),
    [shoppingList.items],
  );

  const eans = useMemo(() => {
    return (
      shoppingList.items?.filter((item) => item.ean).map((item) => item.ean) ||
      []
    );
  }, [shoppingList.items]);

  const productQueries = useQueries({
    queries: eans.map((ean) => ({
      queryKey: productByEanQueryKey(ean),
      queryFn: () => cijeneService.getProductByEan({ ean }),
      enabled: Boolean(ean),
      staleTime: 6 * 60 * 60 * 1000, // 6 hours
    })),
  });

  const productsLoading = productQueries.some((query) => query.isLoading);
  const productsError = productQueries.some((query) => query.error);
  const productsData = productQueries
    .map((query) => query.data)
    .filter((data): data is ProductResponse => data !== undefined);

  const allChains = useMemo(
    () => buildChainAggregates(productsData, activeItems),
    [productsData, activeItems],
  );

  const completeStoresAnalysis = useMemo(
    () => findCompleteStoresAnalysis(allChains, activeItems),
    [allChains, activeItems],
  );

  const cheapestCountByChain = useMemo(
    () => countCheapestByChain(productsData, activeItems),
    [productsData, activeItems],
  );

  const storesWithLowestPriceItems = useMemo<Set<string>>(
    () => new Set(cheapestCountByChain.keys()),
    [cheapestCountByChain],
  );

  const storesWithHighestPriceItems = useMemo(
    () => findHighestPriceStores(productsData, activeItems),
    [productsData, activeItems],
  );

  const absolutePrices = useMemo(
    () => computeAbsolutePrices(allChains, activeItems),
    [allChains, activeItems],
  );

  // Sort a copy (never mutate the memoized allChains) by the chosen optimisation
  // mode; pinned stores always stay on top inside compareStoreChains.
  const sortedChains = useMemo(() => {
    const pinnedStoreIds = pinnedStores?.map((store) => store.storeApiId) || [];

    return [...allChains].sort((a, b) =>
      compareStoreChains(a, b, pinnedStoreIds, optimizeBy, cheapestCountByChain),
    );
  }, [allChains, optimizeBy, pinnedStores, cheapestCountByChain]);

  return {
    activeItems,
    allChains,
    productsLoading,
    productsError,
    productsData,
    completeStoresAnalysis,
    storesWithLowestPriceItems,
    storesWithHighestPriceItems,
    absolutePrices,
    sortedChains,
  };
}
