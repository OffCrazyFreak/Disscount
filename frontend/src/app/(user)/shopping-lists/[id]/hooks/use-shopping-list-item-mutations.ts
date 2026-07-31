import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

/**
 * @param shareToken present when the list was reached through a share link, in which case
 *   writes go to /api/shared/{token}: the token is the capability, so knowing the list id
 *   is never enough on its own.
 */
export function useShoppingListItemMutations(
  listId: string,
  averagePrices: Record<string, number>,
  storePrices: Record<string, Record<string, number>>,
  shareToken?: string,
) {
  const queryClient = useQueryClient();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const updateItemMutation = shoppingListService.useUpdateShoppingListItem();
  const deleteItemMutation = shoppingListService.useDeleteShoppingListItem();
  const updateSharedItemMutation =
    shoppingListService.useUpdateSharedShoppingListItem();
  const deleteSharedItemMutation =
    shoppingListService.useDeleteSharedShoppingListItem();

  const queryKey = shareToken
    ? SHOPPING_LIST_QUERY_KEYS.byToken(shareToken)
    : SHOPPING_LIST_QUERY_KEYS.byId(listId);

  const handleUpdateItem = async (
    itemId: string,
    updatedItem: {
      isChecked: boolean;
      amount: number;
      chainCode: string | null;
    },
  ) => {
    const shoppingList = queryClient.getQueryData<ShoppingList>(queryKey);

    const item = shoppingList?.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Validate amount
    if (updatedItem.amount < 1) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData<ShoppingList>(queryKey);

    queryClient.setQueryData<ShoppingList | undefined>(queryKey, (old) => {
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
    });

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

    function rollback() {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
    }

    if (shareToken) {
      updateSharedItemMutation.mutate(
        { token: shareToken, itemId, data: updateData },
        // No toast here: the shared mutation's offline defaults already carry one, and it
        // is the only handler that survives a replay after a reload.
        { onError: rollback },
      );
      return;
    }

    updateItemMutation.mutate(
      {
        listId,
        itemId,
        data: updateData,
      },
      {
        onError: (error: Error) => {
          rollback();
          toast.error(
            error.message || "Greška pri ažuriranju stavke. Pokušaj ponovno.",
          );
        },
      },
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);

    // Optimistic update
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData<ShoppingList>(queryKey);

    queryClient.setQueryData<ShoppingList | undefined>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items?.filter((i) => i.id !== itemId),
      };
    });

    function rollback() {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
    }

    if (shareToken) {
      deleteSharedItemMutation.mutate(
        { token: shareToken, itemId },
        {
          onError: rollback,
          onSuccess: () => toast.success("Stavka je uspješno obrisana!"),
          onSettled: () => setDeletingItemId(null),
        },
      );
      return;
    }

    // Delete the item
    deleteItemMutation.mutate(
      { listId, itemId },
      {
        onError: (error: Error) => {
          rollback();
          toast.error(
            error.message || "Greška pri brisanju stavke. Pokušaj ponovno.",
          );
        },
        onSuccess: () => {
          toast.success("Stavka je uspješno obrisana!");
        },
        onSettled: () => {
          setDeletingItemId(null);
        },
      },
    );
  };

  return {
    handleUpdateItem,
    handleDeleteItem,
    deletingItemId,
  };
}
