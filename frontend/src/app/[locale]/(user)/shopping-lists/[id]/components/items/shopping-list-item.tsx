import { Separator } from "@/components/ui/separator";

import type { ShoppingListItemDto } from "@/lib/api/types";
import RemoveItemButton from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/remove-item-button";
import ItemAmountControls from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/item-amount-controls";
import ItemPriceDisplay from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/item-price-display";
import ItemCheckBox from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/item-check-box";
import ItemName from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/item-name";
import type { IShoppingListItemUpdate } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/shopping-list-item-types";
import ItemStoreSelect from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/item-store-select";
import type { ItemPriceState } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";

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
  /** Ticking off and switching store: the in-the-shop actions. */
  canCheck: boolean;
  /** Amount and removal. */
  canEditItems: boolean;
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
}: IShoppingListItemProps) {
  return (
    <>
      <div className="relative isolate flex flex-wrap items-center justify-between gap-6 py-1 sm:flex-nowrap">
        {/* Left side: Checkbox, item name, and delete button (mobile) */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <ItemCheckBox item={item} onUpdate={onUpdate} canCheck={canCheck} />
          <ItemName item={item} isFirst={isFirst} isLast={isLast} />

          {/* Delete button - shown on mobile in same row as item name */}
          {canEditItems && (
            <RemoveItemButton
              visibilityClassName="relative z-20 sm:hidden"
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          )}
        </div>

        {/* Right side: Amount controls, price, and remove button */}
        <div className="flex flex-shrink-0 items-center justify-between gap-8 w-full sm:w-auto">
          <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row w-full">
            <div className="flex items-center justify-between gap-6">
              <ItemPriceDisplay
                item={item}
                averagePrice={averagePrice}
                isPriceLoading={priceState === "loading"}
              />

              <ItemAmountControls
                item={item}
                onUpdate={onUpdate}
                canEdit={canEditItems}
              />
            </div>

            {/* Store Chain Select */}
            <ItemStoreSelect
              item={item}
              onUpdate={onUpdate}
              priceState={priceState}
              cheapestStore={cheapestStore}
              averagePrice={averagePrice}
              storePrices={storePrices}
              canCheck={canCheck}
            />
          </div>

          {/* Remove button - hidden on mobile, shown on larger screens */}
          {canEditItems && (
            <RemoveItemButton
              visibilityClassName="relative z-20 hidden sm:flex"
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          )}
        </div>
      </div>

      {/* Separator (except for last item) */}
      {showSeparator && <Separator className="my-2" />}
    </>
  );
}
