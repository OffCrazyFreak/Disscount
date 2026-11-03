import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { IShoppingListItemUpdate } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/shopping-list-item-types";
import { SHARED_ACCESS_BANNER_ID } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

interface IItemCheckBoxProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  canCheck: boolean;
  /** The chain the store select shows while the item has none saved. */
  cheapestStore?: string;
}

export default function ItemCheckBox({
  item,
  onUpdate,
  canCheck,
  cheapestStore,
}: IItemCheckBoxProps) {
  const t = useTranslations("shoppingListDetail");

  return (
    <Checkbox
      aria-label={
        item.isChecked
          ? t("items.markUnbought", { name: item.name })
          : t("items.markBought", { name: item.name })
      }
      className="relative z-20"
      checked={item.isChecked}
      disabled={!canCheck}
      aria-describedby={canCheck ? undefined : SHARED_ACCESS_BANNER_ID}
      onCheckedChange={(checked) =>
        onUpdate({
          isChecked: checked as boolean,
          amount: item.amount || 1,
          // Ticking saves the store the select shows, so the price paid is captured there.
          chainCode: item.chainCode ?? cheapestStore ?? null,
        })
      }
    />
  );
}
