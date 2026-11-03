"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ShoppingListDto } from "@/lib/api/types";
import ShoppingListStoreItem from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-store-card";
import { useUser } from "@/context/user-context";
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

  const sortNoteId = useId();
  const distance = useStoreOptimizeMode();

  const {
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
    <div className="space-y-2">
      <h2 className="py-2 text-lg font-semibold">{t("stores.title")}</h2>

      <ShoppingListStoresBody
        isLoading={productsLoading}
        hasItems={!!shoppingList.items && shoppingList.items.length > 0}
        // Any item still to buy, plain ones too: only unpriced ones left means "no prices".
        hasActiveItems={
          shoppingList.items?.some((item) => !item.isChecked) ?? false
        }
        hasError={hasFailedPrices}
        hasChains={allChains.length > 0}
      >
        <div className="space-y-4">
          <StoreOptimizeSelect
            value={distance.chosen}
            onValueChange={distance.choose}
            describedById={sortNoteId}
          />

          <DistanceSortNote
            id={sortNoteId}
            state={distance.state}
            origin={distance.origin}
            towns={distance.towns}
            onPickTown={distance.chooseTown}
          />

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
              distanceKm={distance.shownDistances?.get(chain.chain)}
            />
          ))}
        </div>
      </ShoppingListStoresBody>
    </div>
  );
}
