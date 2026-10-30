"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ShoppingListItemViews from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-item-views";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { useShoppingListItemMutations } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-item-mutations";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";
import {
  getShoppingListItemsOpen,
  setShoppingListItemsOpen,
} from "@/utils/browser/local-storage";

interface IShoppingListItemsProps {
  shoppingList: ShoppingList;
  cheapestStores: Record<string, string>;
  /** Until prices arrive no item knows its cheapest chain, so nothing groups yet. */
  isPricesLoading: boolean;
  averagePrices: Record<string, number>;
  storePrices: Record<string, Record<string, number>>;
}

export default function ShoppingListItems({
  shoppingList,
  cheapestStores,
  isPricesLoading,
  averagePrices,
  storePrices,
}: IShoppingListItemsProps) {
  const t = useTranslations("shoppingListDetail");

  const { canCheck, canEditItems, isOwner } = resolveShoppingListAccess(
    shoppingList.myAccess,
  );

  const { handleUpdateItem, handleDeleteItem, deletingItemId } =
    useShoppingListItemMutations(shoppingList.id, averagePrices, storePrices);

  const [isItemsOpen, setIsItemsOpen] = useState(() =>
    getShoppingListItemsOpen(shoppingList.id),
  );

  const handleToggleItems = (open: boolean) => {
    setIsItemsOpen(open);
    setShoppingListItemsOpen(shoppingList.id, open);
  };

  const rowProps = {
    cheapestStores,
    averagePrices,
    storePrices,
    onUpdate: handleUpdateItem,
    onDelete: handleDeleteItem,
    deletingItemId,
    canCheck,
    canEditItems,
  };

  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  return (
    <Collapsible open={isItemsOpen} onOpenChange={handleToggleItems}>
      <CollapsibleTrigger asChild className="py-2">
        <button type="button" className="w-full text-left">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
              {checkedCount > 0
                ? t("items.titleWithChecked", {
                    checked: checkedCount,
                    total: shoppingList.items.length,
                  })
                : t("items.title", { total: shoppingList.items.length })}
            </h2>

            <Separator className="flex-1 my-2" />

            <div className="flex items-center gap-4">
              <p className="hidden sm:inline text-gray-700 text-sm">
                {isItemsOpen ? t("toggle.hide") : t("toggle.show")}
              </p>

              <ChevronDown
                className={cn(
                  "size-8 text-gray-500 transition-transform flex-shrink-0",
                  isItemsOpen && "rotate-180",
                )}
              />
            </div>
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {shoppingList.items.length === 0 ? (
          <div className="p-4 text-center">
            <p className="mb-4 text-gray-600">
              {isOwner ? t("items.emptyOwner") : t("items.empty")}
            </p>

            {/* Only the owner can add items, so nobody else gets an invitation to try. */}
            {isOwner && (
              <Button asChild effect="shineHover">
                <Link href="/products">
                  <Search aria-hidden="true" className="size-5" />
                  {t("items.searchProducts")}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <ShoppingListItemViews
            listId={shoppingList.id}
            items={shoppingList.items}
            isPricesLoading={isPricesLoading}
            rowProps={rowProps}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
