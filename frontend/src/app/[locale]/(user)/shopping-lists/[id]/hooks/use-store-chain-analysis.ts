"use client";

import { useMemo } from "react";
import { useListChainAggregates } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-list-chain-aggregates";
import { ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import {
  compareStoreChains,
  type StoreOptimizeMode,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import { computeAbsolutePrices } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-chain-completeness";
import {
  countCheapestByChain,
  findHighestPriceStores,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-chain-extremes";

interface IUseStoreChainAnalysisParams {
  shoppingList: ShoppingListDto;
  pinnedStores: PinnedStoreDto[] | null | undefined;
  optimizeBy: StoreOptimizeMode;
  distanceByChain?: Map<string, number>;
}

export function useStoreChainAnalysis({
  shoppingList,
  pinnedStores,
  optimizeBy,
  distanceByChain,
}: IUseStoreChainAnalysisParams) {
  const { activeItems, productsData, productsLoading, allChains } =
    useListChainAggregates(shoppingList);

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

  // Sort a copy, since Array.sort mutates and allChains is memoized.
  const sortedChains = useMemo(() => {
    const pinnedStoreIds = pinnedStores?.map((store) => store.storeApiId) || [];

    return [...allChains].sort((a, b) =>
      compareStoreChains(
        a,
        b,
        pinnedStoreIds,
        optimizeBy,
        cheapestCountByChain,
        distanceByChain,
      ),
    );
  }, [
    allChains,
    optimizeBy,
    pinnedStores,
    cheapestCountByChain,
    distanceByChain,
  ]);

  return {
    allChains,
    productsLoading,
    productsData,
    storesWithLowestPriceItems,
    storesWithHighestPriceItems,
    absolutePrices,
    sortedChains,
  };
}
