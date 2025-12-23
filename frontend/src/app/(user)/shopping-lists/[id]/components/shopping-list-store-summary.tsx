"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import cijeneService from "@/lib/cijene-api";
import { ShoppingListDto } from "@/lib/api/types";
import { ShoppingListStoreItem } from "./shopping-list-store-item";
import { useUser } from "@/context/user-context";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";

interface ShoppingListStoreSummaryProps {
  shoppingList: ShoppingListDto;
}

export default function ShoppingListStoreSummary({
  shoppingList,
}: ShoppingListStoreSummaryProps) {
  const { user } = useUser();
  // Get all EANs from shopping list items
  const eans = useMemo(() => {
    return (
      shoppingList.items?.filter((item) => item.ean).map((item) => item.ean) ||
      []
    );
  }, [shoppingList.items]);

  // Fetch product data for all EANs
  const productQueries = useQueries({
    queries: eans.map((ean) => ({
      queryKey: ["cijene", "product", "ean", ean],
      queryFn: () => cijeneService.getProductByEan({ ean }),
      enabled: Boolean(ean),
      staleTime: 6 * 60 * 60 * 1000, // 6 hours
    })),
  });

  const productsLoading = productQueries.some((query) => query.isLoading);
  const productsError = productQueries.some((query) => query.error);
  const productsData = productQueries
    .map((query) => query.data)
    .filter((data): data is ProductResponse => data !== undefined);

  // Collect all unique chains from all products
  const allChains = useMemo<
    Array<ChainProductResponse & { itemCount: number }>
  >(() => {
    if (productsData.length === 0) return [];

    const chainMap = new Map<
      string,
      {
        chain: string;
        totalMin: number;
        totalAvg: number;
        totalMax: number;
        itemCount: number;
      }
    >();

    productsData.forEach((product) => {
      if (!product) return;

      product.chains.forEach((chain) => {
        // Find the corresponding shopping list item
        const shoppingItem = shoppingList.items?.find(
          (item) => item.ean === product.ean
        );
        if (!shoppingItem) return;

        const quantity = shoppingItem.amount || 1;
        const minPrice = parseFloat(chain.min_price) * quantity;
        const avgPrice = parseFloat(chain.avg_price) * quantity;
        const maxPrice = parseFloat(chain.max_price) * quantity;

        if (chainMap.has(chain.chain)) {
          const existing = chainMap.get(chain.chain)!;
          existing.totalMin += minPrice;
          existing.totalAvg += avgPrice;
          existing.totalMax += maxPrice;
          existing.itemCount += 1;
        } else {
          chainMap.set(chain.chain, {
            chain: chain.chain,
            totalMin: minPrice,
            totalAvg: avgPrice,
            totalMax: maxPrice,
            itemCount: 1,
          });
        }
      });
    });

    return Array.from(chainMap.values()).map(
      (chainData): ChainProductResponse & { itemCount: number } => ({
        chain: chainData.chain,
        code: "",
        name: "",
        brand: null,
        category: null,
        unit: null,
        quantity: null,
        min_price: chainData.totalMin.toFixed(2),
        avg_price: chainData.totalAvg.toFixed(2),
        max_price: chainData.totalMax.toFixed(2),
        price_date: new Date()
          .toISOString()
          .split("T")[0] as `${number}-${number}-${number}`,
        itemCount: chainData.itemCount,
      })
    );
  }, [productsData, shoppingList.items]);

  // Calculate which stores have all items and find best/worst among them
  const completeStoresAnalysis = useMemo<{
    bestStore: (ChainProductResponse & { itemCount: number }) | null;
    worstStore: (ChainProductResponse & { itemCount: number }) | null;
  }>(() => {
    if (!shoppingList.items || shoppingList.items.length === 0) {
      return { bestStore: null, worstStore: null };
    }

    const totalItems = shoppingList.items.length;
    const completeStores = allChains.filter(
      (chain) => chain.itemCount === totalItems
    );

    if (completeStores.length === 0) {
      return { bestStore: null, worstStore: null };
    }

    // Find store with lowest total price among complete stores
    const bestStore = completeStores.reduce((best, current) => {
      const bestPrice = parseFloat(best.avg_price);
      const currentPrice = parseFloat(current.avg_price);
      return currentPrice < bestPrice ? current : best;
    });

    // Find store with highest total price among complete stores
    const worstStore = completeStores.reduce((worst, current) => {
      const worstPrice = parseFloat(worst.avg_price);
      const currentPrice = parseFloat(current.avg_price);
      return currentPrice > worstPrice ? current : worst;
    });

    return { bestStore, worstStore };
  }, [allChains, shoppingList.items]);

  // Calculate which stores have at least one item with the lowest price
  const storesWithLowestPriceItems = useMemo<Set<string>>(() => {
    const lowestPriceStores = new Set<string>();

    // For each item in the shopping list
    shoppingList.items?.forEach((item) => {
      const product = productsData.find((p) => p?.ean === item.ean);
      if (!product || !product.chains || product.chains.length === 0) return;

      // Find the minimum price for this item across all chains
      const allChainPrices = product.chains
        .map((c) => parseFloat(c.avg_price))
        .filter((p) => !isNaN(p));

      if (allChainPrices.length === 0) return;

      const minPrice = Math.min(...allChainPrices);

      // Find which chains offer this minimum price
      product.chains.forEach((chain) => {
        const chainPrice = parseFloat(chain.avg_price);
        if (chainPrice === minPrice) {
          lowestPriceStores.add(chain.chain);
        }
      });
    });

    return lowestPriceStores;
  }, [productsData, shoppingList.items]);

  // Calculate overall min/max across all chains
  const overallPrices = useMemo<{ min: number; max: number }>(() => {
    if (allChains.length === 0) return { min: 0, max: 0 };

    const avgPrices = allChains.map((chain) => parseFloat(chain.avg_price));
    return {
      min: Math.min(...avgPrices),
      max: Math.max(...avgPrices),
    };
  }, [allChains]);

  if (productsLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Cijene po lancima trgovina
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Dohvaćanje cijena...</div>
        </div>
      </div>
    );
  }

  if (productsError || productsData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Cijene po lancima trgovina
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600">
            Greška pri učitavanju cijena. Pokušajte ponovno.
          </p>
        </div>
      </div>
    );
  }

  if (allChains.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Cijene po lancima trgovina
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600">
            Nema dostupnih cijena za stavke na popisu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        Cijene po lancima trgovina
      </h2>

      <div className="space-y-4">
        {allChains
          .sort((a, b) => {
            // Get user's pinned store IDs
            const pinnedStoreIds =
              user?.pinnedStores?.map((store) => store.storeApiId) || [];

            // Check if chains are pinned
            const aIsPinned = pinnedStoreIds.includes(a.chain);
            const bIsPinned = pinnedStoreIds.includes(b.chain);

            // 1. Pinned chains come first
            if (aIsPinned && !bIsPinned) return -1;
            if (!aIsPinned && bIsPinned) return 1;

            // 2. If both are pinned or both are not pinned, sort by item count (highest first)
            const aItemCount = a.itemCount;
            const bItemCount = b.itemCount;
            if (aItemCount !== bItemCount) return bItemCount - aItemCount;

            // 3. If item counts are equal, sort by average price (lowest first)
            const aAvgPrice = parseFloat(a.avg_price);
            const bAvgPrice = parseFloat(b.avg_price);
            if (aAvgPrice !== bAvgPrice) return aAvgPrice - bAvgPrice;

            // If all criteria are equal, sort alphabetically
            return a.chain.localeCompare(b.chain, "hr", {
              sensitivity: "base",
            });
          })
          .map((chain) => (
            <ShoppingListStoreItem
              key={chain.chain}
              chain={chain}
              shoppingList={shoppingList}
              allChainsMin={overallPrices.min}
              allChainsMax={overallPrices.max}
              productsData={productsData}
              completeStoresAnalysis={completeStoresAnalysis}
              hasLowestPriceItem={storesWithLowestPriceItems.has(chain.chain)}
            />
          ))}
      </div>
    </div>
  );
}
