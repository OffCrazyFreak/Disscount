import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { IShoppingListItemUpdate } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/shopping-list-item-types";

interface IItemAmountControlsProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  canEdit: boolean;
}

export default function ItemAmountControls({
  item,
  onUpdate,
  canEdit,
}: IItemAmountControlsProps) {
  const t = useTranslations("shoppingListDetail");

  // A read-only visitor still needs the amount, so only the buttons go away rather than sitting permanently disabled.
  if (!canEdit) {
    return (
      <span className="relative z-20 text-center min-w-8">
        <span className="sr-only">{t("items.amountLabel")} </span>
        {item.amount}
      </span>
    );
  }

  return (
    // The wrapper takes pointer events because Button's disabled:pointer-events-none lets presses reach the row link.
    <div className="relative z-20 flex items-center gap-2">
      <Button
        size="icon"
        aria-label={t("items.decreaseAmount")}
        className="shrink-0"
        onClick={() =>
          onUpdate({
            isChecked: item.isChecked,
            amount: (item.amount || 1) - 1,
            chainCode: item.chainCode!,
          })
        }
        disabled={(item.amount || 1) <= 1 || item.isChecked}
      >
        <Minus aria-hidden="true" />
      </Button>

      <span className="text-center min-w-8">{item.amount}</span>

      <Button
        size="icon"
        aria-label={t("items.increaseAmount")}
        className="shrink-0"
        onClick={() =>
          onUpdate({
            isChecked: item.isChecked,
            amount: (item.amount || 1) + 1,
            chainCode: item.chainCode!,
          })
        }
        disabled={item.isChecked}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
