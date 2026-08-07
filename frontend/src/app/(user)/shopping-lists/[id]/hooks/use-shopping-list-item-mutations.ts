import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

interface IItemMutationState {
  isPending: boolean;
  isPaused: boolean;
  variables?: { itemId: string };
}

/**
 * Which item is mid-write, read off the mutation rather than mirrored in state.
 *
 * A stored flag has to be cleared, and there are two write paths with an early return
 * between them, so a flag cleared in onSettled is one refactor away from stranding a row
 * spinning. Derived, there is nothing to strand.
 *
 * isPaused, not just isPending: offline a mutation parks rather than settles, so
 * isPending stays true indefinitely and the row would spin with nothing explaining why.
 *
 * TODO: useMutation keeps only the latest variables, so two ticks in flight at once mark
 * the newer row only. Per-row accuracy needs useMutationState filtered by mutationKey.
 */
function pendingItemId(mutation: IItemMutationState): string | null {
  if (!mutation.isPending || mutation.isPaused) return null;

  return mutation.variables?.itemId ?? null;
}

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

  const updatingItemId =
    pendingItemId(updateItemMutation) ??
    pendingItemId(updateSharedItemMutation);

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
    if (!item || updatedItem.amount < 1) return;

    // Prices are captured at the moment of ticking, so they have to be resolved here
    // where the component's price maps live, not inside the mutation. They travel in the
    // request, which is also what the optimistic patch applies.
    const data = { ...item, ...updatedItem };

    if (updatedItem.isChecked) {
      const avgPrice = averagePrices[item.id];
      if (avgPrice !== undefined) data.avgPrice = avgPrice;

      const storePrice =
        updatedItem.chainCode && storePrices[item.id]?.[updatedItem.chainCode];
      if (storePrice) data.storePrice = storePrice;
    } else {
      // data starts as a copy of the cached item, so without this an earlier capture
      // survives the uncheck and gets re-sent. An item unchecked and re-checked at a
      // different shop would keep the first shop's price until a new one overwrote it.
      data.avgPrice = null;
      data.storePrice = null;
    }

    if (shareToken) {
      // No toast: the offline defaults carry one, and they are the only handler that
      // survives a replay after a reload.
      updateSharedItemMutation.mutate({ token: shareToken, itemId, data });
      return;
    }

    updateItemMutation.mutate(
      { listId, itemId, data },
      {
        onError: (error: Error) =>
          toast.error(
            error.message || "Greška pri ažuriranju stavke. Pokušaj ponovno.",
          ),
      },
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);

    if (shareToken) {
      deleteSharedItemMutation.mutate(
        { token: shareToken, itemId },
        {
          onSuccess: () => toast.success("Stavka je uspješno obrisana!"),
          onSettled: () => setDeletingItemId(null),
        },
      );
      return;
    }

    deleteItemMutation.mutate(
      { listId, itemId },
      {
        onError: (error: Error) =>
          toast.error(
            error.message || "Greška pri brisanju stavke. Pokušaj ponovno.",
          ),
        onSuccess: () => toast.success("Stavka je uspješno obrisana!"),
        onSettled: () => setDeletingItemId(null),
      },
    );
  };

  return {
    handleUpdateItem,
    handleDeleteItem,
    deletingItemId,
    updatingItemId,
  };
}
