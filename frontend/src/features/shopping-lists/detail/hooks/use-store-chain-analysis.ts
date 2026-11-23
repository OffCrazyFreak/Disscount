"use client";

import { useListChainAggregates } from "@/features/shopping-lists/detail/hooks/use-list-chain-aggregates";
import { ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/user/preferences";
import {
  compareStoreChains,
  type StoreOptimizeMode,
} from "@/features/shopping-lists/utils/shopping-list-utils";
import { computeAbsolutePrices } from "@/features/shopping-lists/detail/utils/store-chain-completeness";
import {
  countCheapestByChain,
  findHighestPriceStores,
} from "@/features/shopping-lists/detail/utils/store-chain-extremes";

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

  const cheapestCountByChain = countCheapestByChain(productsData, activeItems);

  const storesWithLowestPriceItems = new Set<string>(
    cheapestCountByChain.keys(),
  );

  const storesWithHighestPriceItems = findHighestPriceStores(
    productsData,
    activeItems,
  );

  const absolutePrices = computeAbsolutePrices(allChains, activeItems);

  const pinnedStoreIds = pinnedStores?.map((store) => store.storeApiId) || [];

  // Sort a copy, since Array.sort mutates and allChains is memoized.
  const sortedChains = [...allChains].sort((a, b) =>
    compareStoreChains(
      a,
      b,
      pinnedStoreIds,
      optimizeBy,
      cheapestCountByChain,
      distanceByChain,
    ),
  );

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
