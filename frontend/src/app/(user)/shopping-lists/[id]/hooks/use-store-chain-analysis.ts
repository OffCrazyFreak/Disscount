"use client";

import { useMemo } from "react";
import { useProductsByEans } from "@/lib/cijene-api/use-products-by-eans";
import { ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import {
  compareStoreChains,
  type StoreOptimizeMode,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { buildChainAggregates } from "@/app/(user)/shopping-lists/[id]/utils/store-chain-aggregate";
import { computeAbsolutePrices } from "@/app/(user)/shopping-lists/[id]/utils/store-chain-completeness";
import {
  countCheapestByChain,
  findHighestPriceStores,
} from "@/app/(user)/shopping-lists/[id]/utils/store-chain-extremes";

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

  // combine is memoised by TanStack, so products keeps a stable identity between renders.
  const {
    products: productsData,
    pending: productsLoading,
    isError: productsError,
  } = useProductsByEans(eans);

  const allChains = useMemo(
    () => buildChainAggregates(productsData, activeItems),
    [productsData, activeItems],
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

  // Sort a copy, since Array.sort mutates and allChains is memoized; pinned stores
  // always stay on top inside compareStoreChains.
  const sortedChains = useMemo(() => {
    const pinnedStoreIds = pinnedStores?.map((store) => store.storeApiId) || [];

    return [...allChains].sort((a, b) =>
      compareStoreChains(
        a,
        b,
        pinnedStoreIds,
        optimizeBy,
        cheapestCountByChain,
      ),
    );
  }, [allChains, optimizeBy, pinnedStores, cheapestCountByChain]);

  return {
    activeItems,
    allChains,
    productsLoading,
    productsError,
    productsData,
    storesWithLowestPriceItems,
    storesWithHighestPriceItems,
    absolutePrices,
    sortedChains,
  };
}
