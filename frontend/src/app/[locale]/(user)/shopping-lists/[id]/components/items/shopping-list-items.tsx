"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ShoppingListItemViews from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-item-views";
import ShoppingListPriceStatus from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-price-status";
import type { ItemPriceState } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";
import { focusStoreSelect } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-select-focus";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { useShoppingListItemMutations } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-item-mutations";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";
import {
  getShoppingListItemsOpen,
  setShoppingListItemsOpen,
} from "@/utils/browser/local-storage";
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
  const t = useTranslations("shoppingListDetail");

  const { canCheck, canEditItems, isOwner } = resolveShoppingListAccess(
    shoppingList.myAccess,
  );

  const { handleUpdateItem, handleDeleteItem, deletingItemId } =
    useShoppingListItemMutations(shoppingList.id, averagePrices, storePrices);

  const [isItemsOpen, setIsItemsOpen] = useState(() =>
    getShoppingListItemsOpen(shoppingList.id),
  );

  const handleToggleItems = (open: boolean) => {
    setIsItemsOpen(open);
    setShoppingListItemsOpen(shoppingList.id, open);
  };

  const lostFocusItemIdRef = useRef<string | null>(null);
  const itemsToggleRef = useRef<HTMLButtonElement>(null);

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

  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  const failedPriceItemIds = shoppingList.items
    .filter((item) => priceStates[item.id] === "failed")
    .map((item) => item.id);

  // A row still without prices explains the retry's outcome; one that loaded does not. With
  // the items collapsed there is no row, so the section's toggle is the nearest place left.
  function focusRetriedItem(retriedItemIds: readonly string[]) {
    const unpriced = retriedItemIds.filter((id) => priceStates[id] !== "ready");
    if (!focusStoreSelect(unpriced.length > 0 ? unpriced : retriedItemIds)) {
      itemsToggleRef.current?.focus();
    }
  }

  return (
    <div className="space-y-3">
      {/* Outside the collapsible, so collapsing the items does not hide a failure or its retry. */}
      <ShoppingListPriceStatus
        failedItemIds={failedPriceItemIds}
        isRetrying={isRetryingPrices}
        onRetry={onRetryPrices}
        onRetryFocusLost={focusRetriedItem}
      />

      <Collapsible open={isItemsOpen} onOpenChange={handleToggleItems}>
        <CollapsibleTrigger asChild className="py-2">
          <button
            ref={itemsToggleRef}
            type="button"
            className="w-full text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">
                {checkedCount > 0
                  ? t("items.titleWithChecked", {
                      checked: checkedCount,
                      total: shoppingList.items.length,
                    })
                  : t("items.title", { total: shoppingList.items.length })}
              </h2>

              <Separator className="flex-1 my-2" />

              <div className="flex items-center gap-4">
                <p className="hidden sm:inline text-gray-700 text-sm">
                  {isItemsOpen ? t("toggle.hide") : t("toggle.show")}
                </p>

                <ChevronDown
                  className={cn(
                    "size-8 text-gray-500 transition-transform flex-shrink-0",
                    isItemsOpen && "rotate-180",
                  )}
                />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Only the owner can add items, matching the backend's rule. */}
          {isOwner && (
            <div className="mb-3">
              <ShoppingListQuickAdd listId={shoppingList.id} />
            </div>
          )}

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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
