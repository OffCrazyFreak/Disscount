"use client";

import { useState } from "react";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { ShoppingListDto } from "@/lib/api/types";
import ShoppingListStoreItem from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-store-card";
import { useUser } from "@/context/user-context";
import {
  STORE_OPTIMIZE_MODES,
  type StoreOptimizeMode,
} from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import CollapsibleSection from "@/components/custom/common/collapsible-section";
import {
  getShoppingListStoresOpen,
  setShoppingListStoresOpen,
  getStoreOptimizeMode,
  setStoreOptimizeMode,
} from "@/utils/browser/local-storage";
import { useStoreChainAnalysis } from "@/app/(user)/shopping-lists/[id]/components/stores/use-store-chain-analysis";
import StoreOptimizeSelect from "@/app/(user)/shopping-lists/[id]/components/stores/store-optimize-select";

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

    return stored &&
      (STORE_OPTIMIZE_MODES as readonly string[]).includes(stored)
      ? (stored as StoreOptimizeMode)
      : "products";
  });

  function handleOptimizeChange(value: string) {
    const mode = value as StoreOptimizeMode;
    setOptimizeBy(mode);
    setStoreOptimizeMode(mode);
  }

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
    completeStoresAnalysis,
    storesWithLowestPriceItems,
    storesWithHighestPriceItems,
    absolutePrices,
    sortedChains,
  } = useStoreChainAnalysis({
    shoppingList,
    pinnedStores: user?.pinnedStores,
    optimizeBy,
  });

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
            Greška pri učitavanju cijena. Pokušaj ponovno.
          </p>
        ) : allChains.length === 0 ? (
          <p className="p-2 text-gray-600 text-center">
            Nema dostupnih cijena za stavke na popisu.
          </p>
        ) : (
          <div className="space-y-4">
            <StoreOptimizeSelect
              value={optimizeBy}
              onValueChange={handleOptimizeChange}
            />

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
