import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { shoppingListService } from "@/lib/api";
import cijeneService, { productByEanQueryKey } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  findCheapestStoreFromProduct,
  getStorePricesFromProduct,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import { getAveragePrice } from "@/app/[locale]/products/utils/product-utils";
import {
  isProductNotFound,
  itemPriceState,
  lookupPriceState,
  type ItemPriceState,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";

/**
 * One read for owners and link visitors alike. The endpoint resolves the caller's access
 * from the id, so there is no second path and nothing to choose between here.
 */
export function useShoppingListData(listId: string) {
  const { user } = useUser();

  const {
    data: shoppingList,
    isLoading,
    error,
    refetch,
    dataUpdatedAt: listUpdatedAt,
  } = shoppingListService.useGetShoppingListById(listId);

  const eans = useMemo(
    () => [
      ...new Set(
        shoppingList?.items.map((item) => item.ean).filter(Boolean) ?? [],
      ),
    ],
    [shoppingList?.items],
  );

  // Bought items show the prices saved with them, so only these EANs are worth a retry.
  const unboughtEans = new Set(
    shoppingList?.items
      .filter((item) => !item.isChecked)
      .map((item) => item.ean),
  );

  const productLookups = useQueries({
    queries: eans.map((ean) => ({
      queryKey: productByEanQueryKey(ean),
      queryFn: () => cijeneService.getProductByEan({ ean }),
      staleTime: 6 * 60 * 60 * 1000,
      // The app default of one retry, minus a 404, which asking again cannot change.
      retry: (failureCount: number, error: Error) =>
        !isProductNotFound(error) && failureCount < 1,
    })),
    combine: (results) => {
      const lookups = results.map(
        (result, index) => [eans[index], lookupPriceState(result)] as const,
      );
      const failedIndexes = results.flatMap((_, index) =>
        lookups[index][1] === "failed" && unboughtEans.has(eans[index])
          ? [index]
          : [],
      );

      return {
        // Paired with the requested EAN, not the one echoed back. useQueries keeps
        // results index-aligned with `eans`, and upstream is free to normalise the
        // value it returns, which would silently miss the lookup below.
        productsData: results
          .map((result, index) => [eans[index], result.data] as const)
          .filter((entry): entry is readonly [string, ProductResponse] => {
            return entry[1] !== undefined;
          }),
        lookupStates: lookups,
        retryFailedPrices: () => {
          for (const index of failedIndexes) void results[index].refetch();
        },
        isRetryingPrices: failedIndexes.some(
          (index) => results[index].fetchStatus === "fetching",
        ),
        // A refetch resets a failed query to pending; the list must not ungroup or blank its totals for it.
        isPricesLoading: results.some(
          (result) => result.isLoading && result.errorUpdatedAt === 0,
        ),
      };
    },
  });
  const {
    productsData,
    lookupStates,
    retryFailedPrices,
    isRetryingPrices,
    isPricesLoading,
  } = productLookups;

  const itemPrices = useMemo(() => {
    const productsByEan = new Map(productsData);
    const lookupStatesByEan = new Map(lookupStates);
    const nextCheapestStores: Record<string, string> = {};
    const nextAveragePrices: Record<string, number> = {};
    const nextStorePrices: Record<string, Record<string, number>> = {};
    const nextPriceStates: Record<string, ItemPriceState> = {};

    for (const item of shoppingList?.items ?? []) {
      const product = productsByEan.get(item.ean);
      const itemStorePrices = product && getStorePricesFromProduct(product);
      nextPriceStates[item.id] = itemPriceState(
        item.isChecked,
        lookupStatesByEan.get(item.ean),
        itemStorePrices,
      );
      if (!product || !itemStorePrices) continue;

      const averagePrice = getAveragePrice(product);
      const cheapestStore = findCheapestStoreFromProduct(
        product,
        user?.pinnedStores,
      );

      if (averagePrice !== null) {
        nextAveragePrices[item.id] = averagePrice;
      }

      if (Object.keys(itemStorePrices).length > 0) {
        nextStorePrices[item.id] = itemStorePrices;
      }

      if (cheapestStore) {
        nextCheapestStores[item.id] = cheapestStore;
      }
    }

    return {
      cheapestStores: nextCheapestStores,
      averagePrices: nextAveragePrices,
      storePrices: nextStorePrices,
      priceStates: nextPriceStates,
    };
  }, [productsData, lookupStates, shoppingList?.items, user?.pinnedStores]);
  const { cheapestStores, averagePrices, storePrices, priceStates } =
    itemPrices;

  // Calculate total savings from checked items
  const { totalSavings, totalPotentialCost } = shoppingList?.items
    ?.filter((item) => item.isChecked && item.avgPrice && item.storePrice)
    .reduce(
      (acc, item) => {
        const potentialCost = item.avgPrice! * (item.amount || 1);
        const actualCost = item.storePrice! * (item.amount || 1);
        const savings = potentialCost - actualCost;

        return {
          totalSavings: acc.totalSavings + savings,
          totalPotentialCost: acc.totalPotentialCost + potentialCost,
        };
      },
      { totalSavings: 0, totalPotentialCost: 0 },
    ) || { totalSavings: 0, totalPotentialCost: 0 };

  const savingsPercentage =
    totalPotentialCost > 0 ? (totalSavings / totalPotentialCost) * 100 : 0;

  return {
    shoppingList,
    isLoading,
    error,
    refetch,
    listUpdatedAt,
    cheapestStores,
    averagePrices,
    storePrices,
    priceStates,
    retryFailedPrices,
    isRetryingPrices,
    totalSavings,
    totalPotentialCost,
    savingsPercentage,
    isPricesLoading,
  };
}
