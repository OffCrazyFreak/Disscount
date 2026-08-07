import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { shoppingListQueries } from "@/lib/api/shopping-lists/hooks";
import { useProductsByEans } from "@/lib/cijene-api/use-products-by-eans";
import { useDataPending } from "@/lib/query/use-data-pending";
import { useUser } from "@/context/user-context";
import {
  findCheapestStoreFromProduct,
  getStorePricesFromProduct,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { getAveragePrice } from "@/app/products/utils/product-utils";

/**
 * One read for owners and link visitors alike. The endpoint resolves the caller's access
 * from the id, so there is no second path and nothing to choose between here.
 */
export function useShoppingListData(listId: string) {
  const { user } = useUser();

  // A plain useQuery, not useAuthedQuery: the list id is the shareable link, so this page
  // is reachable signed out, and folding a session into `enabled` would leave the query
  // permanently disabled for exactly the visitor the sharing feature exists for.
  const listQuery = useQuery(shoppingListQueries.byId(listId));

  const {
    data: shoppingList,
    error,
    refetch,
    dataUpdatedAt: listUpdatedAt,
  } = listQuery;

  // useDataPending rather than the query's isLoading, which reads false with no data for
  // the whole persister restore window. There is no auth to wait on here.
  const isLoading = useDataPending(listQuery.isPending);

  const eans = useMemo(
    () => [
      ...new Set(
        shoppingList?.items.map((item) => item.ean).filter(Boolean) ?? [],
      ),
    ],
    [shoppingList?.items],
  );

  const { productsByEan, pending: isPricesLoading } = useProductsByEans(eans);

  const { cheapestStores, averagePrices, storePrices } = useMemo(() => {
    const nextCheapestStores: Record<string, string> = {};
    const nextAveragePrices: Record<string, number> = {};
    const nextStorePrices: Record<string, Record<string, number>> = {};

    for (const item of shoppingList?.items ?? []) {
      const product = productsByEan.get(item.ean);
      if (!product) continue;

      const averagePrice = getAveragePrice(product);
      const itemStorePrices = getStorePricesFromProduct(product);
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
    };
  }, [productsByEan, shoppingList?.items, user?.pinnedStores]);

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
    totalSavings,
    totalPotentialCost,
    savingsPercentage,
    isPricesLoading,
  };
}
