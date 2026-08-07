import { useMemo } from "react";
import {
  shoppingListQueries,
  useGetSharedShoppingList,
} from "@/lib/api/shopping-lists/hooks";
import { useProductsByEans } from "@/lib/cijene-api/use-products-by-eans";
import { useAuthedQuery } from "@/lib/query/use-authed-query";
import { useDataPending } from "@/lib/query/use-data-pending";
import { useUser } from "@/context/user-context";
import {
  findCheapestStoreFromProduct,
  getStorePricesFromProduct,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { getAveragePrice } from "@/app/products/utils/product-utils";

/**
 * @param shareToken when set, the list is read through /api/shared/{token} instead of by
 *   id, which is the only path an anonymous link visitor has.
 */
export function useShoppingListData(listId: string, shareToken?: string) {
  const { user } = useUser();
  const isSharedRead = !!shareToken;

  // Both queries always run, since hook order cannot be conditional. Exactly one is
  // enabled, so only one ever fetches.
  const ownedQuery = useAuthedQuery({
    ...shoppingListQueries.byId(listId),
    enabled: !isSharedRead && !!listId && listId !== "new",
  });

  // Deliberately not useAuthedQuery: a link visitor has no session, so gating this on one
  // would leave it disabled and permanently pending for the only reader it exists for.
  const sharedQuery = useGetSharedShoppingList(shareToken ?? "");

  const {
    data: shoppingList,
    error,
    refetch,
    dataUpdatedAt: listUpdatedAt,
  } = isSharedRead ? sharedQuery : ownedQuery;

  // useAuthedQuery folds the persister's restore window into `pending` for the owned
  // read. The shared read has no auth to wait on but the same restore window, which is
  // what useDataPending covers. The isSharedRead guard matters: a disabled query reports
  // isPending forever, so on the owned path this must not contribute.
  const sharedPending = useDataPending(isSharedRead && sharedQuery.isPending);
  const isLoading = isSharedRead ? sharedPending : ownedQuery.pending;

  // False on a shared read, always. Forwarding the owned query's requiresAuth would put a
  // login wall in front of the entire share feature.
  const requiresAuth = isSharedRead ? false : ownedQuery.requiresAuth;

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
    requiresAuth,
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
