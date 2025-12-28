import { Card } from "@/components/ui/card";
import ShoppingListItem from "./shopping-list-item";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

interface ShoppingListItemsProps {
  shoppingList: ShoppingList;
  onItemCheckedChange: (itemId: string, checked: boolean) => void;
  onItemAmountChange: (itemId: string, newAmount: number) => void;
  onStoreChainChange: (itemId: string, chainCode: string) => void;
  onDeleteItem: (itemId: string) => void;
  deletingItemId: string | null;
  cheapestStores: Record<string, string>;
  averagePrices: Record<string, number>;
  storePrices: Record<string, Record<string, number>>;
}

export default function ShoppingListItems({
  shoppingList,
  onItemCheckedChange,
  onItemAmountChange,
  onStoreChainChange,
  onDeleteItem,
  deletingItemId,
  cheapestStores,
  averagePrices,
  storePrices,
}: ShoppingListItemsProps) {
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
              onCheckedChange={(checked) =>
                onItemCheckedChange(item.id, checked)
              }
              onAmountChange={(newAmount) =>
                onItemAmountChange(item.id, newAmount)
              }
              onStoreChainChange={(chainCode) =>
                onStoreChainChange(item.id, chainCode)
              }
              onDelete={() => onDeleteItem(item.id)}
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
