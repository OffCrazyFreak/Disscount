"use client";

import {
  catalogEans,
  itemsToCompare,
} from "@/app/[locale]/(user)/shopping-lists/utils/catalog-items";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  compareStoreChains,
  type StoreOptimizeMode,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import { productLookupQuery } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/product-lookup-query";
import { buildChainAggregates } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-chain-aggregate";
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
  const activeItems = useMemo(
    () => itemsToCompare(shoppingList.items),
    [shoppingList.items],
  );

  const eans = useMemo(
    () => catalogEans(shoppingList.items),
    [shoppingList.items],
  );

  // combine is memoised by TanStack, so productsData keeps a stable identity between renders.
  const { productsData, productsLoading } = useQueries({
    queries: eans.map((ean) => ({
      ...productLookupQuery(ean),
      enabled: Boolean(ean),
    })),
    combine: (results) => ({
      productsData: results
        .map((result) => result.data)
        .filter((data): data is ProductResponse => data !== undefined),
      // Matches the rows: a refetch after a failure is not a first load.
      productsLoading: results.some(
        (result) => result.isLoading && result.errorUpdatedAt === 0,
      ),
    }),
  });

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
