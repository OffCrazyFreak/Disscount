import StoreChainSelect from "@/components/custom/store-chain/store-chain-select";
import { ALL_CHAIN_CODES } from "@/components/custom/store-chain/store-chain-codes";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { IShoppingListItemUpdate } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/shopping-list-item-types";
import { SHARED_ACCESS_BANNER_ID } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

interface IPlainItemStoreSelectProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  canCheck: boolean;
}

/** No store prices a plain item, so every chain is offered and none is suggested. */
export default function PlainItemStoreSelect({
  item,
  onUpdate,
  canCheck,
}: IPlainItemStoreSelectProps) {
  return (
    <StoreChainSelect
      value={item.chainCode}
      onChange={(chainCode) =>
        onUpdate({
          isChecked: item.isChecked,
          amount: item.amount || 1,
          chainCode,
        })
      }
      chainCodes={ALL_CHAIN_CODES}
      disabled={item.isChecked || !canCheck}
      describedById={canCheck ? undefined : SHARED_ACCESS_BANNER_ID}
      className="relative z-20 w-full sm:w-72 sm:flex-none"
    />
  );
}
