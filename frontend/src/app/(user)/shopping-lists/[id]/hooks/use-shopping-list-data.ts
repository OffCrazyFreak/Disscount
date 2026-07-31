import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { shoppingListService } from "@/lib/api";
import cijeneService, { productByEanQueryKey } from "@/lib/cijene-api";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  findCheapestStoreFromProduct,
  getStorePricesFromProduct,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { getAveragePrice } from "@/app/products/utils/product-utils";

/**
 * @param shareToken when set, the list is read through /api/shared/{token} instead of by
 *   id, which is the only path an anonymous visitor has.
 */
export function useShoppingListData(listId: string, shareToken?: string) {
  const { user } = useUser();

  // Both hooks always run, since hook order cannot be conditional. Each disables itself
  // on an empty argument, so exactly one of them ever fetches.
  const ownedQuery = shoppingListService.useGetShoppingListById(
    shareToken ? "" : listId,
  );
  const sharedQuery = shoppingListService.useGetSharedShoppingList(
    shareToken ?? "",
  );

  const {
    data: shoppingList,
    isLoading,
    error,
    dataUpdatedAt: listUpdatedAt,
  } = shareToken ? sharedQuery : ownedQuery;

  const eans = useMemo(
    () => [
      ...new Set(
        shoppingList?.items.map((item) => item.ean).filter(Boolean) ?? [],
      ),
    ],
    [shoppingList?.items],
  );

  const { productsData, isPricesLoading } = useQueries({
    queries: eans.map((ean) => ({
      queryKey: productByEanQueryKey(ean),
      queryFn: () => cijeneService.getProductByEan({ ean }),
      staleTime: 6 * 60 * 60 * 1000,
    })),
    combine: (results) => ({
      productsData: results
        .map((result) => result.data)
        .filter((data): data is ProductResponse => data !== undefined),
      isPricesLoading: results.some((result) => result.isLoading),
    }),
  });

  const { cheapestStores, averagePrices, storePrices } = useMemo(() => {
    const productsByEan = new Map(
      productsData.map((product) => [product.ean, product]),
    );
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
  }, [productsData, shoppingList?.items, user?.pinnedStores]);

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
