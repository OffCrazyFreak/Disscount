import type { RefObject } from "react";

import { Separator } from "@/components/ui/separator";

import type { ShoppingListItemDto } from "@/lib/api/types";
import RemoveItemButton from "@/features/shopping-lists/detail/components/items/item/remove-item-button";
import ItemAmountControls from "@/features/shopping-lists/detail/components/items/item/item-amount-controls";
import ItemPriceDisplay from "@/features/shopping-lists/detail/components/items/item/item-price-display";
import ItemCheckBox from "@/features/shopping-lists/detail/components/items/item/item-check-box";
import ItemName from "@/features/shopping-lists/detail/components/items/item/item-name";
import RenamePlainItemButton from "@/features/shopping-lists/detail/components/items/plain-item/rename-plain-item-button";
import PlainItemStoreSelect from "@/features/shopping-lists/detail/components/items/plain-item/plain-item-store-select";
import ItemPhoto from "@/features/shopping-lists/detail/components/items/item/item-photo";
import type { IShoppingListItemUpdate } from "@/features/shopping-lists/detail/typings/shopping-list-item-types";
import ItemStoreSelect from "@/features/shopping-lists/detail/components/items/item/item-store-select";
import type { ItemPriceState } from "@/features/shopping-lists/detail/utils/item-price-state";
import { useStoreSelectFocusHandoff } from "@/features/shopping-lists/detail/hooks/use-store-select-focus-handoff";
import { STORE_SELECT_ITEM_ATTRIBUTE } from "@/features/shopping-lists/detail/utils/stores/store-select-focus";

interface IShoppingListItemProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  onDelete: () => void;
  isDeleting: boolean;
  cheapestStore?: string;
  averagePrice?: number;
  storePrices: Record<string, number>;
  priceState: ItemPriceState;
  isFirst: boolean;
  isLast: boolean;
  showSeparator: boolean;
  canCheck: boolean;
  canEditItems: boolean;
  lostFocusItemIdRef: RefObject<string | null>;
}

export default function ShoppingListItem({
  item,
  onUpdate,
  onDelete,
  isDeleting,
  cheapestStore,
  averagePrice,
  storePrices,
  priceState,
  isFirst,
  isLast,
  showSeparator,
  canCheck,
  canEditItems,
  lostFocusItemIdRef,
}: IShoppingListItemProps) {
  const rememberFocusOnUnmount = useStoreSelectFocusHandoff(
    item.id,
    priceState,
    lostFocusItemIdRef,
  );

  return (
    <>
      <div className="relative isolate flex flex-wrap items-center justify-between gap-6 py-1 sm:flex-nowrap">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <ItemCheckBox
            item={item}
            onUpdate={onUpdate}
            canCheck={canCheck}
            cheapestStore={cheapestStore}
          />
          <ItemPhoto item={item} />
          <ItemName item={item} isFirst={isFirst} isLast={isLast} />
          <RenamePlainItemButton
            item={item}
            canRename={canEditItems}
            onUpdate={onUpdate}
          />

          {canEditItems && (
            <RemoveItemButton
              visibilityClassName="relative z-20 sm:hidden"
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-8 w-full sm:w-auto">
          <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row w-full">
            <div className="flex items-center justify-between gap-6">
              <ItemPriceDisplay
                item={item}
                averagePrice={averagePrice}
                isPriceLoading={priceState === "loading"}
                onUpdate={onUpdate}
                canCheck={canCheck}
              />

              <ItemAmountControls
                item={item}
                onUpdate={onUpdate}
                canEdit={canEditItems}
              />
            </div>

            {/* A plain item has no prices, so its select offers every chain without suggesting one. */}
            {item.ean ? (
              <div
                {...{ [STORE_SELECT_ITEM_ATTRIBUTE]: item.id }}
                className="contents"
              >
                <ItemStoreSelect
                  item={item}
                  onUpdate={onUpdate}
                  priceState={priceState}
                  cheapestStore={cheapestStore}
                  averagePrice={averagePrice}
                  storePrices={storePrices}
                  canCheck={canCheck}
                  unavailableSelectRef={rememberFocusOnUnmount}
                />
              </div>
            ) : (
              <PlainItemStoreSelect
                item={item}
                onUpdate={onUpdate}
                canCheck={canCheck}
              />
            )}
          </div>

          {canEditItems && (
            <RemoveItemButton
              visibilityClassName="relative z-20 hidden sm:flex"
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          )}
        </div>
      </div>

      {showSeparator && <Separator className="my-2" />}
    </>
  );
}
