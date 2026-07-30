"use client";

import Link from "next/link";
import { ShoppingListDto } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Calendar, ListChecks } from "lucide-react";
import { formatDate } from "@/utils/strings";
import ShoppingListActionButtons from "@/app/(user)/shopping-lists/[id]/components/shopping-list-action-buttons";
import ShoppingListVisibilityIndicator from "@/app/(user)/shopping-lists/components/shopping-list-visibility-indicator";

interface IShoppingListListItemProps {
  shoppingList: ShoppingListDto;
}

export default function ShoppingListListItem({
  shoppingList,
}: IShoppingListListItemProps) {
  const checkedCount = shoppingList.items.filter(
    (item) => item.isChecked,
  ).length;
  const totalCount = shoppingList.items.length;

  return (
    <Card className="relative p-4 hover:shadow-md transition-shadow">
      {/* Overlay link keeps the card clickable; interactive children stack
          above it rather than nesting inside the anchor */}
      <Link
        href={`/shopping-lists/${shoppingList.id}`}
        aria-label={shoppingList.title}
        className="absolute inset-0 rounded-[inherit]"
      />

      <div className="flex items-stretch sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-center justify-between gap-4 min-w-0 flex-1">
          {/* Title */}
          <h3 className="min-w-0 flex-1 break-words text-pretty text-lg font-bold">
            {shoppingList.title}
          </h3>
          <ShoppingListVisibilityIndicator
            isPublic={shoppingList.isPublic}
            className="relative z-10"
          />
        </div>

        {/* Right-side meta */}
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Updated Date */}
          <div className="flex items-start pt-1 gap-2 text-sm text-gray-600">
            <Calendar className="size-5" />
            <span>{formatDate(shoppingList.updatedAt)}</span>
          </div>
          {/* Item Count */}
          <div className="flex items-start pt-1 gap-2 text-sm text-gray-600">
            <ListChecks className="size-5" />
            <span>
              {checkedCount}/{totalCount}
            </span>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <ShoppingListActionButtons
              shoppingList={shoppingList}
              showEditButton={true}
              showDeleteButton={true}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
