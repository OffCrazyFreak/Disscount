import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";

export function useShoppingListMutations(
  listId: string,
  averagePrices: Record<string, number>,
  storePrices: Record<string, Record<string, number>>
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();
  const updateItemMutation = shoppingListService.useUpdateShoppingListItem();
  const deleteItemMutation = shoppingListService.useDeleteShoppingListItem();

  const confirmDelete = async () => {
    // Prepare optimistic update: remove item from cache immediately
    await queryClient.cancelQueries({ queryKey: ["shoppingLists", "me"] });
    const previous = queryClient.getQueryData<ShoppingList[]>([
      "shoppingLists",
      "me",
    ]);
    queryClient.setQueryData<ShoppingList[] | undefined>(
      ["shoppingLists", "me"],
      (old: ShoppingList[] | undefined) =>
        old ? old.filter((l) => l.id !== listId) : []
    );

    // Fire the delete request
    deleteShoppingListMutation.mutate(listId, {
      onError: (error: Error) => {
        // Rollback cache so UI reflects server state
        if (previous) {
          queryClient.setQueryData(["shoppingLists", "me"], previous);
        }
        toast.error(
          error.message ||
            "Greška pri brisanju popisa za kupnju. Pokušajte ponovno."
        );
      },
      onSuccess: () => {
        toast.success("Popis za kupnju je uspješno obrisan!");
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        router.push("/shopping-lists");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
      },
    });
  };

  const handleItemCheckedChange = async (itemId: string, checked: boolean) => {
    const shoppingList = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    const item = shoppingList?.items?.find((i) => i.id === itemId);
    if (!item) return;

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
              const updatedItem = { ...i, isChecked: checked };
              // If checking the item, include the current average price
              if (checked) {
                const currentAvgPrice = averagePrices[i.id];
                if (currentAvgPrice !== undefined) {
                  updatedItem.avgPrice = currentAvgPrice;
                }
              }
              return updatedItem;
            }
            return i;
          }),
        };
      }
    );

    // Update the item - include avgPrice and storePrice when checking
    const updateData = {
      ...item,
      isChecked: checked,
    };

    // If checking the item, include the current average price and store price
    if (checked) {
      const currentAvgPrice = averagePrices[item.id];
      if (currentAvgPrice !== undefined) {
        updateData.avgPrice = currentAvgPrice;
      }

      // Include the store price from the selected store
      if (item.chainCode && storePrices[item.id]?.[item.chainCode]) {
        updateData.storePrice = storePrices[item.id][item.chainCode];
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

  const handleItemAmountChange = async (itemId: string, newAmount: number) => {
    if (newAmount < 1) return;

    const shoppingList = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    const item = shoppingList?.items?.find((i) => i.id === itemId);
    if (!item) return;

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
          items: old.items?.map((i) =>
            i.id === itemId ? { ...i, amount: newAmount } : i
          ),
        };
      }
    );

    // Update the item
    updateItemMutation.mutate(
      {
        listId,
        itemId,
        data: {
          ...item,
          amount: newAmount,
        },
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

  const handleStoreChainChange = async (itemId: string, chainCode: string) => {
    const shoppingList = queryClient.getQueryData<ShoppingList>([
      "shoppingLists",
      listId,
    ]);

    const item = shoppingList?.items?.find((i) => i.id === itemId);
    if (!item) return;

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
          items: old.items?.map((i) =>
            i.id === itemId ? { ...i, chainCode: chainCode } : i
          ),
        };
      }
    );

    // Update the item
    updateItemMutation.mutate(
      {
        listId,
        itemId,
        data: {
          ...item,
          chainCode: chainCode,
        },
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
    deleteShoppingListMutation,
    confirmDelete,
    handleItemCheckedChange,
    handleItemAmountChange,
    handleStoreChainChange,
    handleDeleteItem,
    deletingItemId,
  };
}
