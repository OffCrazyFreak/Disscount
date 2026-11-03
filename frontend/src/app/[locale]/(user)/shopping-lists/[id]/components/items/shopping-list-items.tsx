"use client";

import { useRef } from "react";
import ShoppingListItemViews from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-item-views";
import ShoppingListPriceStatus from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-price-status";
import type { ItemPriceState } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";
import { focusStoreSelect } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-select-focus";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { useShoppingListItemMutations } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-item-mutations";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";
import ShoppingListItemsEmpty from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-items-empty";
import ShoppingListQuickAdd from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-quick-add";

interface IShoppingListItemsProps {
  shoppingList: ShoppingList;
  cheapestStores: Record<string, string>;
  /** Until prices arrive no item knows its cheapest chain, so nothing groups yet. */
  isPricesLoading: boolean;
  averagePrices: Record<string, number>;
  storePrices: Record<string, Record<string, number>>;
  priceStates: Record<string, ItemPriceState>;
  isRetryingPrices: boolean;
  onRetryPrices: () => Promise<boolean>;
}

export default function ShoppingListItems({
  shoppingList,
  cheapestStores,
  isPricesLoading,
  averagePrices,
  storePrices,
  priceStates,
  isRetryingPrices,
  onRetryPrices,
}: IShoppingListItemsProps) {
  const { canCheck, canEditItems, isOwner } = resolveShoppingListAccess(
    shoppingList.myAccess,
  );

  const { handleUpdateItem, handleDeleteItem, deletingItemId } =
    useShoppingListItemMutations(shoppingList.id, averagePrices, storePrices);

  const lostFocusItemIdRef = useRef<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const rowProps = {
    cheapestStores,
    averagePrices,
    storePrices,
    priceStates,
    onUpdate: handleUpdateItem,
    onDelete: handleDeleteItem,
    deletingItemId,
    canCheck,
    canEditItems,
    lostFocusItemIdRef,
  };

  const failedPriceItemIds = shoppingList.items
    .filter((item) => priceStates[item.id] === "failed")
    .map((item) => item.id);

  // A row still without prices explains the retry's outcome; one that loaded does not. When
  // no retried row is left on screen, the section itself is the nearest place left.
  function focusRetriedItem(retriedItemIds: readonly string[]) {
    const unpriced = retriedItemIds.filter((id) => priceStates[id] !== "ready");
    if (!focusStoreSelect(unpriced.length > 0 ? unpriced : retriedItemIds)) {
      // The tab panel is named by its tab, so landing there still says where focus went.
      const panel =
        sectionRef.current?.closest<HTMLElement>('[role="tabpanel"]');
      (panel ?? sectionRef.current)?.focus();
    }
  }

  return (
    <div ref={sectionRef} tabIndex={-1} className="space-y-3 outline-none">
      <ShoppingListPriceStatus
        failedItemIds={failedPriceItemIds}
        isRetrying={isRetryingPrices}
        onRetry={onRetryPrices}
        onRetryFocusLost={focusRetriedItem}
      />

      {/* Only the owner can add items, matching the backend's rule. */}
      {isOwner && <ShoppingListQuickAdd listId={shoppingList.id} />}

      {shoppingList.items.length === 0 ? (
        <ShoppingListItemsEmpty isOwner={isOwner} />
      ) : (
        <ShoppingListItemViews
          listId={shoppingList.id}
          items={shoppingList.items}
          isPricesLoading={isPricesLoading}
          rowProps={rowProps}
        />
      )}
    </div>
  );
}
