"use client";

import { Calendar, ListChecks } from "lucide-react";
import type { ShoppingListDto } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import HoldProgressRing from "@/components/custom/common/hold-progress-ring";
import StretchedLink from "@/components/custom/common/stretched-link";
import { formatDate } from "@/utils/strings";
import { shoppingListPath } from "@/utils/shopping-list-links";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import useCardLongPress from "@/hooks/use-card-long-press";
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
  const listPath = shoppingListPath(shoppingList.id);

  const { pressProps, actionProps, cancelNavigationAfterPress } =
    useCardLongPress(() =>
      openModalUrl({ name: "shopping-list-actions", id: shoppingList.id }),
    );

  return (
    <Card
      {...pressProps}
      // Suppresses the iOS selection callout a long press would raise on touch.
      className="relative p-4 transition-shadow hover:shadow-md [@media(hover:none)]:select-none [-webkit-touch-callout:none]"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 sm:flex sm:gap-4">
        <h3 className="min-w-0 break-words text-pretty text-lg font-bold sm:flex-1">
          <StretchedLink
            href={listPath}
            onNavigate={cancelNavigationAfterPress}
          >
            {shoppingList.title}
          </StretchedLink>
        </h3>

        <div className="relative z-20 flex items-center gap-1 sm:hidden">
          <ShoppingListVisibilityIndicator isPublic={shoppingList.isPublic} />
        </div>

        <div className="relative z-10 col-span-2 flex items-center justify-between gap-4 text-sm text-gray-600 sm:col-span-1 sm:justify-start sm:gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="size-5" aria-hidden="true" />
            <span>{formatDate(shoppingList.updatedAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <ListChecks className="size-5" aria-hidden="true" />
            <span>
              {checkedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Desktop only. Touch reaches the same actions by holding the card. */}
        <div
          className="relative z-20 hidden items-center gap-1 sm:flex sm:gap-2"
          {...actionProps}
        >
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

      {/* Draws nothing until a hold starts, so it can stay mounted. */}
      <HoldProgressRing
        progress="var(--press-progress, 0)"
        className="absolute top-1/2 left-1/2 size-[3.6rem] -translate-x-1/2 -translate-y-1/2 stroke-primary"
      />
    </Card>
  );
}
