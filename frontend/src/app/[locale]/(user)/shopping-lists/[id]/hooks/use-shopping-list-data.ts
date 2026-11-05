import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { shoppingListService } from "@/lib/api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  findCheapestStoreFromProduct,
  getStorePricesFromProduct,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import { getAveragePrice } from "@/app/[locale]/products/utils/product-utils";
import { catalogEans } from "@/app/[locale]/(user)/shopping-lists/utils/catalog-items";
import {
  isSettledLookupError,
  itemPriceState,
  lookupPriceState,
  type ItemPriceState,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";
import { productLookupQuery } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/product-lookup-query";

/** The endpoint resolves the caller's access from the id, so owners and link visitors share this one read. */
export function useShoppingListData(listId: string) {
  const { accountUser } = useUser();

  const {
    data: shoppingList,
    isLoading,
    error,
    refetch,
    dataUpdatedAt: listUpdatedAt,
  } = shoppingListService.useGetShoppingListById(listId);

  const eans = useMemo(
    () => catalogEans(shoppingList?.items),
    [shoppingList?.items],
  );

  // Bought items show the prices saved with them, so only these EANs are worth a retry.
  const unboughtEans = new Set(
    shoppingList?.items
      .filter((item) => !item.isChecked)
      .map((item) => item.ean),
  );

  const [lastErrors, setLastErrors] = useState<
    Readonly<Record<string, ItemPriceState>>
  >({});

  const productLookups = useQueries({
    queries: eans.map(productLookupQuery),
    combine: (results) => {
      const lookups = results.map(
        (result, index) =>
          [
            eans[index],
            lookupPriceState(result, lastErrors[eans[index]]),
          ] as const,
      );
      const failedIndexes = results.flatMap((_, index) =>
        // A query that keeps its data after a failed background refetch still shows prices.
        results[index].data === undefined &&
        lookups[index][1] === "failed" &&
        unboughtEans.has(eans[index])
          ? [index]
          : [],
      );

      return {
        // Paired with the requested EAN, because upstream may normalise the one it returns.
        productsData: results
          .map((result, index) => [eans[index], result.data] as const)
          .filter((entry): entry is readonly [string, ProductResponse] => {
            return entry[1] !== undefined;
          }),
        lookupStates: lookups,
        /** Resolves true when every retried EAN loaded. */
        retryFailedPrices: async () => {
          const outcomes = await Promise.all(
            failedIndexes.map((index) => results[index].refetch()),
          );
          return outcomes.every((outcome) => outcome.isSuccess);
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

  // Stored during render, React's pattern for keeping information from earlier renders.
  const newErrors = lookupStates.filter(
    ([ean, state]) => isSettledLookupError(state) && lastErrors[ean] !== state,
  );
  if (newErrors.length > 0) {
    setLastErrors({ ...lastErrors, ...Object.fromEntries(newErrors) });
  }

  const itemPrices = useMemo(() => {
    const productsByEan = new Map(productsData);
    const lookupStatesByEan = new Map(lookupStates);
    const nextCheapestStores: Record<string, string> = {};
    const nextAveragePrices: Record<string, number> = {};
    const nextStorePrices: Record<string, Record<string, number>> = {};
    const nextPriceStates: Record<string, ItemPriceState> = {};

    for (const item of shoppingList?.items ?? []) {
      // A plain item has no lookup, so it has no price state to report.
      if (!item.ean) continue;

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
        accountUser?.pinnedStores,
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
  }, [
    productsData,
    lookupStates,
    shoppingList?.items,
    accountUser?.pinnedStores,
  ]);
  const { cheapestStores, averagePrices, storePrices, priceStates } =
    itemPrices;

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
    isPricesLoading,
  };
}
