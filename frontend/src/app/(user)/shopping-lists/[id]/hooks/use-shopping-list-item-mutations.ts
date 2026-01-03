import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

export function useShoppingListItemMutations(
  listId: string,
  averagePrices: Record<string, number>,
  storePrices: Record<string, Record<string, number>>
) {
  const queryClient = useQueryClient();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const updateItemMutation = shoppingListService.useUpdateShoppingListItem();
  const deleteItemMutation = shoppingListService.useDeleteShoppingListItem();

  const handleItemUpdate = async (
    itemId: string,
    updatedItem: {
      isChecked: boolean;
      amount: number;
      chainCode: string | null;
    }
  ) => {
    const shoppingList = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    const item = shoppingList?.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Validate amount
    if (updatedItem.amount < 1) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", listId] });
    const previousData = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    queryClient.setQueryData<ShoppingList | undefined>(
      ["shoppingLists", listId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items?.map((i) => {
            if (i.id === itemId) {
              const updated = { ...i, ...updatedItem };
              // If checking the item, include the current average price
              if (updatedItem.isChecked) {
                const currentAvgPrice = averagePrices[i.id];
                if (currentAvgPrice !== undefined) {
                  updated.avgPrice = currentAvgPrice;
                }
              }
              return updated;
            }
            return i;
          }),
        };
      }
    );

    // Prepare update data
    const updateData = {
      ...item,
      ...updatedItem,
    };

    // If checking the item, include the current average price and store price
    if (updatedItem.isChecked) {
      const currentAvgPrice = averagePrices[item.id];
      if (currentAvgPrice !== undefined) {
        updateData.avgPrice = currentAvgPrice;
      }

      // Include the store price from the selected store
      if (
        updatedItem.chainCode &&
        storePrices[item.id]?.[updatedItem.chainCode]
      ) {
        updateData.storePrice = storePrices[item.id][updatedItem.chainCode];
      }
    }

    updateItemMutation.mutate(
      {
        listId,
        itemId,
        data: updateData,
      },
      {
        onError: (error: Error) => {
          if (previousData) {
            queryClient.setQueryData(["shoppingLists", listId], previousData);
          }
          toast.error(
            error.message || "Greška pri ažuriranju stavke. Pokušajte ponovno."
          );
        },
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: ["shoppingLists", listId],
          });
          queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        },
      }
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);

    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", listId] });
    const previousData = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    queryClient.setQueryData<ShoppingList | undefined>(
      ["shoppingLists", listId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items?.filter((i) => i.id !== itemId),
        };
      }
    );

    // Delete the item
    deleteItemMutation.mutate(
      { listId, itemId },
      {
        onError: (error: Error) => {
          if (previousData) {
            queryClient.setQueryData(["shoppingLists", listId], previousData);
          }
          toast.error(
            error.message || "Greška pri brisanju stavke. Pokušajte ponovno."
          );
        },
        onSuccess: () => {
          toast.success("Stavka je uspješno obrisana!");
        },
        onSettled: () => {
          setDeletingItemId(null);
          queryClient.invalidateQueries({
            queryKey: ["shoppingLists", listId],
          });
          queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        },
      }
    );
  };

  return {
    handleItemUpdate,
    handleDeleteItem,
    deletingItemId,
  };
}
