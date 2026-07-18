"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import cijeneService from "@/lib/cijene-api";
import { ShoppingListDto } from "@/lib/api/types";
import ShoppingListStoreItem from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-store-card";
import { useUser } from "@/context/user-context";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  compareStoreChains,
  STORE_OPTIMIZE_MODES,
  type StoreOptimizeMode,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import CollapsibleSection from "@/components/custom/collapsible-section";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getShoppingListStoresOpen,
  setShoppingListStoresOpen,
  getStoreOptimizeMode,
  setStoreOptimizeMode,
} from "@/utils/browser/local-storage";

interface IShoppingListStoreSummaryProps {
  shoppingList: ShoppingListDto;
}

export default function ShoppingListStoreSummary({
  shoppingList,
}: IShoppingListStoreSummaryProps) {
  const { user } = useUser();

  const [isStoresOpen, setIsStoresOpen] = useState(() =>
    getShoppingListStoresOpen(shoppingList.id),
  );

  const [optimizeBy, setOptimizeBy] = useState<StoreOptimizeMode>(() => {
    const stored = getStoreOptimizeMode();

    return stored && (STORE_OPTIMIZE_MODES as readonly string[]).includes(stored)
      ? (stored as StoreOptimizeMode)
      : "products";
  });

  const handleOptimizeChange = (value: string) => {
    const mode = value as StoreOptimizeMode;
    setOptimizeBy(mode);
    setStoreOptimizeMode(mode);
  };

  const handleToggleStores = (open: boolean) => {
    setIsStoresOpen(open);
    setShoppingListStoresOpen(shoppingList.id, open);
  };

  // Optimise the store comparison over the products still to buy: items already
  // ticked off as bought are excluded from every store metric below.
  const activeItems = useMemo(
    () => (shoppingList.items ?? []).filter((item) => !item.isChecked),
    [shoppingList.items],
  );

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
        // Find the corresponding not-yet-bought shopping list item
        const shoppingItem = activeItems.find(
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
  }, [productsData, activeItems]);

  // Calculate which stores have all items and find best/worst among them
  const completeStoresAnalysis = useMemo<{
    bestStore: (ChainProductResponse & { itemCount: number }) | null;
    worstStore: (ChainProductResponse & { itemCount: number }) | null;
  }>(() => {
    if (activeItems.length === 0) {
      return { bestStore: null, worstStore: null };
    }

    const totalItems = activeItems.length;
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
  }, [allChains, activeItems]);

  // Count, per chain, how many list products are cheapest (global minimum) at
  // that chain. Drives the "total" (product-by-product) mode and the per-store
  // lowest-price badge.
  const cheapestCountByChain = useMemo<Map<string, number>>(() => {
    const counts = new Map<string, number>();

    activeItems.forEach((item) => {
      const product = productsData.find((p) => p?.ean === item.ean);
      if (!product || !product.chains || product.chains.length === 0) return;

      const chainPrices = product.chains
        .map((chain) => parseFloat(chain.avg_price))
        .filter((price) => !isNaN(price));

      if (chainPrices.length === 0) return;

      const minPrice = Math.min(...chainPrices);

      // Every chain offering this minimum price gets a point for this product
      product.chains.forEach((chain) => {
        if (parseFloat(chain.avg_price) === minPrice) {
          counts.set(chain.chain, (counts.get(chain.chain) || 0) + 1);
        }
      });
    });

    return counts;
  }, [productsData, activeItems]);

  const storesWithLowestPriceItems = useMemo<Set<string>>(
    () => new Set(cheapestCountByChain.keys()),
    [cheapestCountByChain],
  );

  // Calculate which stores have at least one item with the highest price
  const storesWithHighestPriceItems = useMemo<Set<string>>(() => {
    const highestPriceStores = new Set<string>();

    // For each not-yet-bought item in the shopping list
    activeItems.forEach((item) => {
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
  }, [productsData, activeItems]);

  // Calculate absolute global minimum and maximum across ALL price types
  // Only consider stores that have every not-yet-bought item from the list
  const absolutePrices = useMemo<{ min: number; max: number }>(() => {
    if (activeItems.length === 0) {
      return { min: 0, max: 0 };
    }

    const totalItems = activeItems.length;
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
  }, [allChains, activeItems]);

  // Sort a copy (never mutate the memoized allChains) by the chosen optimisation
  // mode; pinned stores always stay on top inside compareStoreChains.
  const sortedChains = useMemo(() => {
    const pinnedStoreIds =
      user?.pinnedStores?.map((store) => store.storeApiId) || [];

    return [...allChains].sort((a, b) =>
      compareStoreChains(a, b, pinnedStoreIds, optimizeBy, cheapestCountByChain),
    );
  }, [allChains, optimizeBy, user?.pinnedStores, cheapestCountByChain]);

  return (
    <CollapsibleSection
      title="Cijene po lancima trgovina"
      open={isStoresOpen}
      onOpenChange={handleToggleStores}
    >
      <>
        {productsLoading ? (
          <div className="grid place-items-center">
            <BlockLoadingSpinner />
          </div>
        ) : !shoppingList.items || shoppingList.items.length === 0 ? (
          <p className="p-2 text-gray-600 text-center">
            Ovaj popis još ne sadrži proizvode. Probaj pretražiti proizvode pa
            ih dodaj na ovaj popis.
          </p>
        ) : activeItems.length === 0 ? (
          <p className="p-2 text-gray-600 text-center">
            Svi proizvodi su označeni kao kupljeni.
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">
                Optimiziraj po
              </span>

              <Select value={optimizeBy} onValueChange={handleOptimizeChange}>
                <SelectTrigger className="w-full sm:w-60 bg-white" size="sm">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="products">Broj proizvoda</SelectItem>
                  <SelectItem value="basket">Najjeftinija košarica</SelectItem>
                  <SelectItem value="total">Zasebnim proizvodima</SelectItem>
                  <SelectItem value="distance" disabled>
                    <span className="flex items-center gap-2">
                      Udaljenost
                      <Badge className="text-[10px]">USKORO</Badge>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sortedChains.map((chain) => (
              <ShoppingListStoreItem
                key={chain.chain}
                chain={chain}
                shoppingList={shoppingList}
                absoluteMinPrice={absolutePrices.min}
                absoluteMaxPrice={absolutePrices.max}
                productsData={productsData}
                completeStoresAnalysis={completeStoresAnalysis}
                hasLowestPriceItem={storesWithLowestPriceItems.has(chain.chain)}
                hasHighestPriceItem={storesWithHighestPriceItems.has(
                  chain.chain,
                )}
              />
            ))}
          </div>
        )}
      </>
    </CollapsibleSection>
  );
}
