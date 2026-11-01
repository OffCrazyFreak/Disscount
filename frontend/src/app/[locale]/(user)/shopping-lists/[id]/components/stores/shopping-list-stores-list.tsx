"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingListDto } from "@/lib/api/types";
import ShoppingListStoreItem from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-store-card";
import { useUser } from "@/context/user-context";
import {
  isStoreOptimizeMode,
  type StoreOptimizeMode,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import CollapsibleSection from "@/components/custom/common/collapsible-section";
import {
  getShoppingListStoresOpen,
  setShoppingListStoresOpen,
  getStoreOptimizeMode,
  setStoreOptimizeMode,
} from "@/utils/browser/local-storage";
import { useStoreChainAnalysis } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-store-chain-analysis";
import ShoppingListStoresBody from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-body";
import StoreOptimizeSelect from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/store-optimize-select";
import DistanceSortNote from "@/app/[locale]/products/components/distance-sort-note";
import { useDistanceSort } from "@/app/[locale]/products/hooks/use-distance-sort";
import { nearestDistanceByChain } from "@/app/[locale]/products/utils/nearest-chain-distance";

interface IShoppingListStoreSummaryProps {
  shoppingList: ShoppingListDto;
}

export default function ShoppingListStoreSummary({
  shoppingList,
}: IShoppingListStoreSummaryProps) {
  const t = useTranslations("shoppingListDetail");
  const { user } = useUser();

  const [isStoresOpen, setIsStoresOpen] = useState(() =>
    getShoppingListStoresOpen(shoppingList.id),
  );

  const sortNoteId = useId();
  const [storedMode] = useState<StoreOptimizeMode>(() => {
    const stored = getStoreOptimizeMode();

    // Restoring "distance" would ask for the location before any tap.
    return isStoreOptimizeMode(stored) && stored !== "distance"
      ? stored
      : "products";
  });
  const distance = useDistanceSort(storedMode, "products");

  function handleOptimizeChange(mode: StoreOptimizeMode) {
    distance.choose(mode);
    if (mode !== "distance") setStoreOptimizeMode(mode);
  }

  // No per-store prices here, so each chain's nearest store of any kind.
  const { origin, stores } = distance;
  const distanceByChain = useMemo(
    () =>
      origin && stores ? nearestDistanceByChain(origin, stores) : undefined,
    [origin, stores],
  );

  function handleToggleStores(open: boolean) {
    setIsStoresOpen(open);
    setShoppingListStoresOpen(shoppingList.id, open);
  }

  const {
    activeItems,
    allChains,
    productsLoading,
    productsError,
    productsData,
    storesWithLowestPriceItems,
    storesWithHighestPriceItems,
    absolutePrices,
    sortedChains,
  } = useStoreChainAnalysis({
    shoppingList,
    pinnedStores: user?.pinnedStores,
    optimizeBy: distance.sortMode,
    distanceByChain,
  });

  return (
    <CollapsibleSection
      title={t("stores.title")}
      open={isStoresOpen}
      onOpenChange={handleToggleStores}
    >
      <ShoppingListStoresBody
        isLoading={productsLoading}
        hasItems={!!shoppingList.items && shoppingList.items.length > 0}
        hasActiveItems={activeItems.length > 0}
        hasError={!!productsError}
        hasChains={allChains.length > 0}
      >
        <div className="space-y-4">
          <StoreOptimizeSelect
            value={distance.chosen}
            onValueChange={handleOptimizeChange}
            describedById={sortNoteId}
          />

          <DistanceSortNote id={sortNoteId} state={distance.state} />

          {sortedChains.map((chain) => (
            <ShoppingListStoreItem
              key={chain.chain}
              chain={chain}
              shoppingList={shoppingList}
              absoluteMinPrice={absolutePrices.min}
              absoluteMaxPrice={absolutePrices.max}
              productsData={productsData}
              hasLowestPriceItem={storesWithLowestPriceItems.has(chain.chain)}
              hasHighestPriceItem={storesWithHighestPriceItems.has(chain.chain)}
              distanceKm={distanceByChain?.get(chain.chain)}
            />
          ))}
        </div>
      </ShoppingListStoresBody>
    </CollapsibleSection>
  );
}
