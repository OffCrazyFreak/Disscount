import { useState, useEffect } from "react";
import { shoppingListService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import {
  findCheapestStoreForItem,
  getAveragePriceForItem,
  getStorePricesForItem,
} from "@/utils/shopping-list-utils";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

export function useShoppingListData(listId: string) {
  const { user } = useUser();
  const [cheapestStores, setCheapestStores] = useState<Record<string, string>>(
    {}
  );
  const [averagePrices, setAveragePrices] = useState<Record<string, number>>(
    {}
  );
  const [storePrices, setStorePrices] = useState<
    Record<string, Record<string, number>>
  >({});

  const {
    data: shoppingList,
    isLoading,
    error,
  } = shoppingListService.useGetShoppingListById(listId);

  // Compute cheapest stores for all items
  useEffect(() => {
    if (!shoppingList?.items || !user?.pinnedStores) return;

    const abortController = new AbortController();

    const computeCheapestStores = async () => {
      try {
        const promises = shoppingList.items.map(async (item) => {
          try {
            const cheapestStore = await findCheapestStoreForItem(
              item,
              user.pinnedStores || undefined
            );
            return { itemId: item.id, cheapestStore };
          } catch (error) {
            console.error(
              `Failed to find cheapest store for item ${item.id}:`,
              error
            );
            return { itemId: item.id, cheapestStore: null };
          }
        });

        const results = await Promise.allSettled(promises);

        if (abortController.signal.aborted) return;

        const stores: Record<string, string> = {};
        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.cheapestStore) {
            stores[result.value.itemId] = result.value.cheapestStore;
          }
        });

        setCheapestStores(stores);
      } catch (error) {
        console.error("Error computing cheapest stores:", error);
      }
    };

    computeCheapestStores();

    return () => {
      abortController.abort();
    };
  }, [shoppingList?.items, user?.pinnedStores]);

  // Compute average prices and store prices for all items on page load
  useEffect(() => {
    if (!shoppingList?.items) return;

    const computeAveragePrices = async () => {
      const prices: Record<string, number> = {};
      const stores: Record<string, Record<string, number>> = {};

      // Fetch price data for ALL items, regardless of checked status
      // This ensures data is always available when toggling items
      for (const item of shoppingList.items) {
        const avgPrice = await getAveragePriceForItem(item);
        const itemStorePrices = await getStorePricesForItem(item);

        if (avgPrice !== null) {
          prices[item.id] = avgPrice;
        }

        if (Object.keys(itemStorePrices).length > 0) {
          stores[item.id] = itemStorePrices;
        }
      }

      setAveragePrices(prices);
      setStorePrices(stores);
    };

    computeAveragePrices();
  }, [shoppingList?.items]);

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
      { totalSavings: 0, totalPotentialCost: 0 }
    ) || { totalSavings: 0, totalPotentialCost: 0 };

  const savingsPercentage =
    totalPotentialCost > 0 ? (totalSavings / totalPotentialCost) * 100 : 0;

  return {
    shoppingList,
    isLoading,
    error,
    cheapestStores,
    averagePrices,
    storePrices,
    totalSavings,
    totalPotentialCost,
    savingsPercentage,
  };
}
