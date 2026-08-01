"use client";

import Link from "next/link";
import { Calendar, ChevronRight, ListChecks } from "lucide-react";
import type { ShoppingListDto } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/utils/strings";
import { shoppingListPath } from "@/utils/shopping-list-links";
import ShoppingListActionButtons from "@/app/(user)/shopping-lists/[id]/components/shopping-list-action-buttons";
import ShoppingListVisibilityIndicator from "@/app/(user)/shopping-lists/components/shopping-list-visibility-indicator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const listPath = shoppingListPath(shoppingList.id);

  return (
    <Card className="relative p-4 hover:shadow-md transition-shadow">
      <Link
        href={listPath}
        aria-label={`Otvori popis: ${shoppingList.title}`}
        className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 sm:flex sm:gap-4">
        <h3 className="min-w-0 break-words text-pretty text-lg font-bold sm:flex-1">
          {shoppingList.title}
        </h3>

        <div className="relative z-10 flex items-center gap-1 sm:hidden">
          <ShoppingListVisibilityIndicator isPublic={shoppingList.isPublic} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="primary" asChild>
                <Link
                  href={listPath}
                  aria-label={`Otvori popis: ${shoppingList.title}`}
                >
                  <ChevronRight aria-hidden="true" />
                </Link>
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Otvori popis
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:justify-start sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="size-5" aria-hidden="true" />
            <span>{formatDate(shoppingList.updatedAt)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ListChecks className="size-5" aria-hidden="true" />
            <span>
              {checkedCount}/{totalCount}
            </span>
          </div>
        </div>

        <div className="relative z-10 hidden items-center gap-1 sm:flex sm:gap-2">
          <ShoppingListVisibilityIndicator isPublic={shoppingList.isPublic} />
          <ShoppingListActionButtons
            shoppingList={shoppingList}
            showCopyButton={true}
            showShareButton={true}
            showEditButton={true}
            showDeleteButton={true}
            mobilePresentation="none"
          />
        </div>
      </div>
    </Card>
  );
}
