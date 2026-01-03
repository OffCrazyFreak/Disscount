import { Card } from "@/components/ui/card";
import ShoppingListItem from "./shopping-list-item";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { useShoppingListItemMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-item-mutations";

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
  const { handleItemUpdate, handleDeleteItem, deletingItemId } =
    useShoppingListItemMutations(shoppingList.id, averagePrices, storePrices);

  const itemCount = shoppingList.items?.length || 0;

  if (itemCount === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Proizvodi (0)</h2>
        <Card className="p-8 text-center">
          <p className="text-gray-600">Ovaj popis još nema stavki.</p>
        </Card>
      </div>
    );
  }

  const sortedItems = [...shoppingList.items].sort((a, b) =>
    a.name.localeCompare(b.name, "hr", { sensitivity: "base" })
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Proizvodi ({itemCount})</h2>
      <Card className="p-4">
        <div className="space-y-1">
          {sortedItems.map((item, index) => (
            <ShoppingListItem
              key={item.id}
              item={item}
              onUpdate={(updatedItem) => handleItemUpdate(item.id, updatedItem)}
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
    </div>
  );
}
