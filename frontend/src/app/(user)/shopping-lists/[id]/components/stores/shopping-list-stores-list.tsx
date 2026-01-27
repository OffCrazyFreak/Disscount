"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import cijeneService from "@/lib/cijene-api";
import { ShoppingListDto } from "@/lib/api/types";
import { ShoppingListStoreItem } from "./shopping-list-store-card";
import { useUser } from "@/context/user-context";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { compareStoreChains } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getShoppingListStoresOpen,
  setShoppingListStoresOpen,
} from "@/utils/browser/local-storage";

interface ShoppingListStoreSummaryProps {
  shoppingList: ShoppingListDto;
}

export default function ShoppingListStoreSummary({
  shoppingList,
}: ShoppingListStoreSummaryProps) {
  const { user } = useUser();

  const [isStoresOpen, setIsStoresOpen] = useState(() =>
    getShoppingListStoresOpen(shoppingList.id),
  );

  const handleToggleStores = (open: boolean) => {
    setIsStoresOpen(open);
    setShoppingListStoresOpen(shoppingList.id, open);
  };

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
          (item) => item.ean === product.ean,
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
      }),
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
      (chain) => chain.itemCount === totalItems,
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

  // Calculate which stores have at least one item with the highest price
  const storesWithHighestPriceItems = useMemo<Set<string>>(() => {
    const highestPriceStores = new Set<string>();

    // For each item in the shopping list
    shoppingList.items?.forEach((item) => {
      const product = productsData.find((p) => p?.ean === item.ean);
      if (!product || !product.chains || product.chains.length === 0) return;

      // Find the maximum price for this item across all chains
      const allChainPrices = product.chains
        .map((c) => parseFloat(c.avg_price))
        .filter((p) => !isNaN(p));

      if (allChainPrices.length === 0) return;

      const maxPrice = Math.max(...allChainPrices);

      // Find which chains offer this maximum price
      product.chains.forEach((chain) => {
        const chainPrice = parseFloat(chain.avg_price);
        if (chainPrice === maxPrice) {
          highestPriceStores.add(chain.chain);
        }
      });
    });

    return highestPriceStores;
  }, [productsData, shoppingList.items]);

  // Calculate absolute global minimum and maximum across ALL price types
  // Only consider stores that have ALL items from the shopping list
  const absolutePrices = useMemo<{ min: number; max: number }>(() => {
    if (!shoppingList.items || shoppingList.items.length === 0) {
      return { min: 0, max: 0 };
    }

    const totalItems = shoppingList.items.length;
    const completeChains = allChains.filter(
      (chain) => chain.itemCount === totalItems,
    );

    if (completeChains.length === 0) return { min: 0, max: 0 };

    const allPrices: number[] = [];
    completeChains.forEach((chain) => {
      allPrices.push(parseFloat(chain.min_price));
      allPrices.push(parseFloat(chain.avg_price));
      allPrices.push(parseFloat(chain.max_price));
    });

    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices),
    };
  }, [allChains, shoppingList.items]);

  return (
    <Collapsible open={isStoresOpen} onOpenChange={handleToggleStores}>
      <CollapsibleTrigger asChild className="cursor-pointer py-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Cijene po lancima trgovina</h2>

          <Separator className="flex-1 my-2" />

          <div className="flex items-center gap-4">
            <p className="hidden sm:inline text-gray-700 text-sm">
              {isStoresOpen ? "Sakrij" : "Prikaži"}
            </p>

            <ChevronDown
              className={cn(
                "size-8 text-gray-500 transition-transform flex-shrink-0",
                isStoresOpen && "rotate-180",
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {productsLoading ? (
          <div className="grid place-items-center">
            <BlockLoadingSpinner />
          </div>
        ) : !shoppingList.items || shoppingList.items.length === 0 ? (
          <p className="p-2 text-gray-600 text-center">
            Ovaj popis još ne sadrži proizvode. Probaj pretražiti proizvode pa
            ih dodaj na ovaj popis.
          </p>
        ) : productsError ? (
          <p className="p-2 text-gray-600 text-center">
            Greška pri učitavanju cijena. Pokušajte ponovno.
          </p>
        ) : allChains.length === 0 ? (
          <p className="p-2 text-gray-600 text-center">
            Nema dostupnih cijena za stavke na popisu.
          </p>
        ) : (
          <div className="space-y-4">
            {allChains
              .sort((a, b) => {
                // Get user's pinned store IDs
                const pinnedStoreIds =
                  user?.pinnedStores?.map((store) => store.storeApiId) || [];
                return compareStoreChains(a, b, pinnedStoreIds);
              })
              .map((chain) => (
                <ShoppingListStoreItem
                  key={chain.chain}
                  chain={chain}
                  shoppingList={shoppingList}
                  absoluteMinPrice={absolutePrices.min}
                  absoluteMaxPrice={absolutePrices.max}
                  productsData={productsData}
                  completeStoresAnalysis={completeStoresAnalysis}
                  hasLowestPriceItem={storesWithLowestPriceItems.has(
                    chain.chain,
                  )}
                  hasHighestPriceItem={storesWithHighestPriceItems.has(
                    chain.chain,
                  )}
                />
              ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
