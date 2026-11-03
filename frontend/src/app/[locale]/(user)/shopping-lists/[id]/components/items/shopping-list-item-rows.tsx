"use client";

import type { RefObject } from "react";

import ShoppingListItem from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-item";
import type { IShoppingListItemUpdate } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/shopping-list-item-types";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { ItemPriceState } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";

export interface IShoppingListItemRowsProps {
  items: ShoppingListItemDto[];
  cheapestStores: Record<string, string>;
  averagePrices: Record<string, number>;
  storePrices: Record<string, Record<string, number>>;
  priceStates: Record<string, ItemPriceState>;
  onUpdate: (itemId: string, item: IShoppingListItemUpdate) => void;
  onDelete: (itemId: string) => void;
  deletingItemId: string | null;
  canCheck: boolean;
  canEditItems: boolean;
  lostFocusItemIdRef: RefObject<string | null>;
}

/** One run of items, shared by the A to Z list and each store's section. */
export default function ShoppingListItemRows({
  items,
  cheapestStores,
  averagePrices,
  storePrices,
  priceStates,
  onUpdate,
  onDelete,
  deletingItemId,
  canCheck,
  canEditItems,
  lostFocusItemIdRef,
}: IShoppingListItemRowsProps) {
  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <ShoppingListItem
          key={item.id}
          item={item}
          onUpdate={(updatedItem) => onUpdate(item.id, updatedItem)}
          onDelete={() => onDelete(item.id)}
          isDeleting={deletingItemId === item.id}
          cheapestStore={cheapestStores[item.id]}
          averagePrice={averagePrices[item.id]}
          storePrices={storePrices[item.id] || {}}
          priceState={priceStates[item.id] ?? "loading"}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          showSeparator={index < items.length - 1}
          canCheck={canCheck}
          canEditItems={canEditItems}
          lostFocusItemIdRef={lostFocusItemIdRef}
        />
      ))}
    </div>
  );
}
