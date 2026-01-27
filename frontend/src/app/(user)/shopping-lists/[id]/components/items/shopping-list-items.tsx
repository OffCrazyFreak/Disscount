"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ShoppingListItem from "./shopping-list-item";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { useShoppingListItemMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-item-mutations";
import {
  getShoppingListItemsOpen,
  setShoppingListItemsOpen,
} from "@/utils/browser/local-storage";

interface ShoppingListItemsProps {
  shoppingList: ShoppingList;
  cheapestStores: Record<string, string>;
  averagePrices: Record<string, number>;
  storePrices: Record<string, Record<string, number>>;
}

export default function ShoppingListItems({
  shoppingList,
  cheapestStores,
  averagePrices,
  storePrices,
}: ShoppingListItemsProps) {
  const { handleUpdateItem, handleDeleteItem, deletingItemId } =
    useShoppingListItemMutations(shoppingList.id, averagePrices, storePrices);

  const [isItemsOpen, setIsItemsOpen] = useState(() =>
    getShoppingListItemsOpen(shoppingList.id),
  );

  const handleToggleItems = (open: boolean) => {
    setIsItemsOpen(open);
    setShoppingListItemsOpen(shoppingList.id, open);
  };

  const sortedItems = [...shoppingList.items].sort((a, b) =>
    a.name.localeCompare(b.name, "hr", { sensitivity: "base" }),
  );

  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  return (
    <Collapsible open={isItemsOpen} onOpenChange={handleToggleItems}>
      <CollapsibleTrigger asChild className="py-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {checkedCount > 0
              ? `Proizvodi (${checkedCount}/${shoppingList.items.length} kupljeno)`
              : `Proizvodi (${shoppingList.items.length})`}
          </h2>

          <Separator className="flex-1 my-2" />

          <div className="flex items-center gap-4">
            <p className="hidden sm:inline text-gray-700 text-sm">
              {isItemsOpen ? "Sakrij" : "Prikaži"}
            </p>

            <ChevronDown
              className={cn(
                "size-8 text-gray-500 transition-transform flex-shrink-0",
                isItemsOpen && "rotate-180",
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {shoppingList.items.length === 0 ? (
          <p className="p-2 text-gray-600 text-center">
            Ovaj popis još ne sadrži proizvode. Probaj pretražiti proizvode pa
            ih dodaj na ovaj popis.
          </p>
        ) : (
          <Card className="p-4">
            <div className="space-y-1">
              {sortedItems.map((item, index) => (
                <ShoppingListItem
                  key={item.id}
                  item={item}
                  onUpdate={(updatedItem) =>
                    handleUpdateItem(item.id, updatedItem)
                  }
                  onDelete={() => handleDeleteItem(item.id)}
                  isDeleting={deletingItemId === item.id}
                  cheapestStore={cheapestStores[item.id]}
                  averagePrice={averagePrices[item.id]}
                  storePrices={storePrices[item.id] || {}}
                  showSeparator={index < sortedItems.length - 1}
                />
              ))}
            </div>
          </Card>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
