import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

export function useShoppingListItemMutations(
  listId: string,
  averagePrices: Record<string, number>,
  storePrices: Record<string, Record<string, number>>,
) {
  const t = useTranslations("shoppingListDetail");
  const queryClient = useQueryClient();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const updateItemMutation = shoppingListService.useUpdateShoppingListItem();
  const deleteItemMutation = shoppingListService.useDeleteShoppingListItem();

  const queryKey = SHOPPING_LIST_QUERY_KEYS.byId(listId);

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

    // Captured at the moment of ticking, so resolved here where the price maps live.
    const data = { ...item, ...updatedItem };

    if (updatedItem.isChecked) {
      const avgPrice = averagePrices[item.id];
      if (avgPrice !== undefined) data.avgPrice = avgPrice;

      const storePrice =
        updatedItem.chainCode && storePrices[item.id]?.[updatedItem.chainCode];
      if (storePrice) data.storePrice = storePrice;
    } else {
      // data copies the cached item, so an earlier capture would survive the uncheck.
      data.avgPrice = null;
      data.storePrice = null;
    }

    // No per-call onError: the offline default is the only handler that survives a replay after reload.
    updateItemMutation.mutate({ listId, itemId, data });
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);

    deleteItemMutation.mutate(
      { listId, itemId },
      {
        onSuccess: () => toast.success(t("toasts.itemDeleted")),
        onSettled: () => setDeletingItemId(null),
      },
    );
  };

  return {
    handleUpdateItem,
    handleDeleteItem,
    deletingItemId,
  };
}
