import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import StretchedLink from "@/components/custom/common/stretched-link";
import StoreChainSelect from "@/components/custom/store-chain/store-chain-select";

import type { ShoppingListItemDto } from "@/lib/api/types";
import RemoveItemButton from "@/app/(user)/shopping-lists/[id]/components/items/remove-item-button";
import ItemAmountControls from "@/app/(user)/shopping-lists/[id]/components/items/item-amount-controls";
import ItemPriceDisplay from "@/app/(user)/shopping-lists/[id]/components/items/item-price-display";
import type { IShoppingListItemUpdate } from "@/app/(user)/shopping-lists/[id]/typings/shopping-list-item-types";
import { cn } from "@/lib/utils";
import { productPath } from "@/utils/product-links";

interface IShoppingListItemProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  onDelete: () => void;
  isDeleting: boolean;
  cheapestStore?: string;
  averagePrice?: number;
  storePrices: Record<string, number>;
  isFirst: boolean;
  isLast: boolean;
  showSeparator: boolean;
}

export default function ShoppingListItem({
  item,
  onUpdate,
  onDelete,
  isDeleting,
  cheapestStore,
  averagePrice,
  storePrices,
  isFirst,
  isLast,
  showSeparator,
}: IShoppingListItemProps) {
  return (
    <>
      <div className="relative flex flex-wrap items-center justify-between gap-6 py-1 sm:flex-nowrap">
        {/* Left side: Checkbox, item name, and delete button (mobile) */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Checkbox
            aria-label={
              item.isChecked
                ? `Označi ${item.name} kao nekupljeno`
                : `Označi ${item.name} kao kupljeno`
            }
            className="relative z-20"
            checked={item.isChecked}
            onCheckedChange={(checked) =>
              onUpdate({
                isChecked: checked as boolean,
                amount: item.amount || 1,
                chainCode: item.chainCode!,
              })
            }
          />
          <div className="flex-1">
            <p
              className={`text-sm sm:text-md text-pretty ${
                item.isChecked ? "line-through text-gray-500" : ""
              }`}
            >
              <StretchedLink
                href={productPath(item.ean)}
                // The row is padded by its container, so the hit area bleeds past
                // it to cover the whole strip, rounding off at the list's ends.
                className={cn(
                  "after:-left-4 after:-right-4",
                  isFirst ? "after:-top-4 after:rounded-t-xl" : "after:top-0",
                  isLast
                    ? "after:-bottom-4 after:rounded-b-xl"
                    : "after:bottom-0",
                )}
              >
                {item.name}
              </StretchedLink>
            </p>
            {item.brand && (
              <p className="relative z-10 w-fit text-xs sm:text-sm text-gray-600 text-pretty">
                {item.brand}
              </p>
            )}
          </div>

          {/* Delete button - shown on mobile in same row as item name */}
          <RemoveItemButton
            visibilityClassName="relative z-20 sm:hidden"
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>

        {/* Right side: Amount controls, price, and remove button */}
        <div className="flex flex-shrink-0 items-center justify-between gap-8 w-full sm:w-auto">
          <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row w-full">
            <div className="flex items-center justify-between gap-6">
              <ItemPriceDisplay item={item} averagePrice={averagePrice} />

              <ItemAmountControls item={item} onUpdate={onUpdate} />
            </div>

            {/* Store Chain Select */}
            <StoreChainSelect
              value={item.chainCode}
              onChange={(chainCode) =>
                onUpdate({
                  isChecked: item.isChecked,
                  amount: item.amount || 1,
                  chainCode,
                })
              }
              disabled={item.isChecked}
              defaultValue={cheapestStore}
              storePrices={storePrices}
              averagePrice={averagePrice}
              isChecked={item.isChecked}
              storePriceFromDb={item.storePrice || undefined}
              className="relative z-20 w-full sm:w-72 sm:flex-none"
            />
          </div>

          {/* Remove button - hidden on mobile, shown on larger screens */}
          <RemoveItemButton
            visibilityClassName="relative z-20 hidden sm:flex"
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Separator (except for last item) */}
      {showSeparator && <Separator className="my-2" />}
    </>
  );
}
