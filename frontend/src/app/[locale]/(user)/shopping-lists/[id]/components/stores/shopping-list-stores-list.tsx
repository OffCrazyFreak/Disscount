"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingListDto } from "@/lib/api/types";
import ShoppingListStoreItem from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-store-card";
import { useUser } from "@/context/user-context";
import CollapsibleSection from "@/components/custom/common/collapsible-section";
import {
  getShoppingListStoresOpen,
  setShoppingListStoresOpen,
} from "@/utils/browser/local-storage";
import { useStoreChainAnalysis } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-store-chain-analysis";
import ShoppingListStoresBody from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-body";
import StoreOptimizeSelect from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/store-optimize-select";
import DistanceSortNote from "@/components/custom/distance-sort/distance-sort-note";
import { useStoreOptimizeMode } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-store-optimize-mode";

interface IShoppingListStoreSummaryProps {
  shoppingList: ShoppingListDto;
  /** From the rows' price states, so the summary and the list banner never disagree. */
  hasFailedPrices: boolean;
}

export default function ShoppingListStoreSummary({
  shoppingList,
  hasFailedPrices,
}: IShoppingListStoreSummaryProps) {
  const t = useTranslations("shoppingListDetail");
  const { user } = useUser();

  const [isStoresOpen, setIsStoresOpen] = useState(() =>
    getShoppingListStoresOpen(shoppingList.id),
  );

  const sortNoteId = useId();
  const distance = useStoreOptimizeMode();

  function handleToggleStores(open: boolean) {
    setIsStoresOpen(open);
    setShoppingListStoresOpen(shoppingList.id, open);
  }

  const {
    activeItems,
    allChains,
    productsLoading,
    productsData,
    storesWithLowestPriceItems,
    storesWithHighestPriceItems,
    absolutePrices,
    sortedChains,
  } = useStoreChainAnalysis({
    shoppingList,
    pinnedStores: user?.pinnedStores,
    optimizeBy: distance.sortMode,
    distanceByChain: distance.distanceByChain,
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
        hasError={hasFailedPrices}
        hasChains={allChains.length > 0}
      >
        <div className="space-y-4">
          <StoreOptimizeSelect
            value={distance.chosen}
            onValueChange={distance.choose}
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
              distanceKm={distance.distanceByChain?.get(chain.chain)}
            />
          ))}
        </div>
      </ShoppingListStoresBody>
    </CollapsibleSection>
  );
}
