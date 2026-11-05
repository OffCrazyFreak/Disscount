"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  catalogEans,
  itemsToCompare,
} from "@/app/[locale]/(user)/shopping-lists/utils/catalog-items";
import { productLookupQuery } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/product-lookup-query";
import { buildChainAggregates } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-chain-aggregate";
import { ShoppingListDto } from "@/lib/api/types";
import { ProductResponse } from "@/lib/cijene-api/schemas";

/** Every chain carrying an item still to buy, from the cached product lookups. */
export function useListChainAggregates(shoppingList: ShoppingListDto) {
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

  return { activeItems, productsData, productsLoading, allChains };
}
