import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import type {
  ShoppingListDto as ShoppingList,
  ShoppingListRequest,
  ShoppingListItemRequest,
} from "@/lib/api/types";

export function useShoppingListMutations(
  listId: string,
  shoppingList?: ShoppingList
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCopying, setIsCopying] = useState(false);

  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();

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

  async function handleCopy() {
    if (!shoppingList) return;

    setIsCopying(true);
    try {
      // Create new shopping list with copied title
      const newListData: ShoppingListRequest = {
        title: `${shoppingList.title} (Kopija)`,
        isPublic: false,
      };

      const newList = await shoppingListService.createShoppingList(newListData);

      // Copy items with only the necessary fields
      if (shoppingList.items && shoppingList.items.length > 0) {
        const copyPromises = shoppingList.items.map((item) => {
          const newItemData: ShoppingListItemRequest = {
            ean: item.ean,
            name: item.name,
            brand: item.brand,
            quantity: item.quantity,
            unit: item.unit,
            amount: item.amount,
            // Default values (not copying these from original)
            isChecked: false,
            chainCode: null,
            avgPrice: null,
            storePrice: null,
          };

          return shoppingListService.addItemToShoppingList(
            newList.id,
            newItemData
          );
        });

        await Promise.all(copyPromises);
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({
        queryKey: ["shoppingLists"],
      });

      // Show success toast
      toast.success("Popis za kupnju je uspješno kopiran!");

      // Navigate to new shopping list
      router.push(`/shopping-lists/${newList.id}`);
    } catch (error) {
      console.error("Error copying shopping list:", error);
      toast.error("Greška pri kopiranju popisa za kupnju");
    } finally {
      setIsCopying(false);
    }
  }

  return {
    deleteShoppingListMutation,
    confirmDelete,
    handleCopy,
    isCopying,
  };
}
