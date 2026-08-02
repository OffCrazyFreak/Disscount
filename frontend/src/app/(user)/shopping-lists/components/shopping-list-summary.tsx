"use client";

import { Calendar, ListChecks } from "lucide-react";

import type { ShoppingListDto } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";
import ShoppingListVisibilityIndicator from "@/app/(user)/shopping-lists/components/shopping-list-visibility-indicator";

interface IShoppingListSummaryProps {
  shoppingList: ShoppingListDto;
}

/**
 * How a shopping list reads inside its actions sheet: the same title, date and
 * progress the card shows, so the sheet is obviously about what was pressed.
 */
export default function ShoppingListSummary({
  shoppingList,
}: IShoppingListSummaryProps) {
  const checkedCount = shoppingList.items.filter(
    (item) => item.isChecked,
  ).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-pretty text-base font-bold">
          {shoppingList.title}
        </h3>

        <ShoppingListVisibilityIndicator linkAccess={shoppingList.linkAccess} />
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Calendar aria-hidden="true" className="size-5" />
          {formatDate(shoppingList.updatedAt)}
        </span>

        <span className="flex items-center gap-2">
          <ListChecks aria-hidden="true" className="size-5" />
          {checkedCount}/{shoppingList.items.length}
        </span>
      </div>
    </div>
  );
}
