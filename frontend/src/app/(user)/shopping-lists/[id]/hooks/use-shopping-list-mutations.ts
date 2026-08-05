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
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";

export function useShoppingListMutations(
  listId: string,
  shoppingList?: ShoppingList,
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCopying, setIsCopying] = useState(false);

  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();

  const confirmDelete = async () => {
    // Prepare optimistic update: remove item from cache immediately
    await queryClient.cancelQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.me });
    const previous = queryClient.getQueryData<ShoppingList[]>([
      "shoppingLists",
      "me",
    ]);
    queryClient.setQueryData<ShoppingList[] | undefined>(
      SHOPPING_LIST_QUERY_KEYS.me,
      (old: ShoppingList[] | undefined) =>
        old ? old.filter((l) => l.id !== listId) : [],
    );

    // Awaited rather than handed per-call callbacks: those are gated behind the
    // observer still having listeners, and the caller in the actions sheet
    // unmounts as soon as it fires. The rollback and both toasts were dropped
    // silently, leaving a failed delete looking like a successful one.
    try {
      await deleteShoppingListMutation.mutateAsync(listId);

      toast.success("Popis za kupnju je uspješno obrisan!");
      router.push("/shopping-lists");
    } catch (error) {
      // Rollback cache so UI reflects server state
      if (previous) {
        queryClient.setQueryData(SHOPPING_LIST_QUERY_KEYS.me, previous);
      }
      toast.error(
        (error instanceof Error && error.message) ||
          "Greška pri brisanju popisa za kupnju. Pokušaj ponovno.",
      );
    } finally {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.me });
    }
  };

  async function handleCopy() {
    if (!shoppingList) return;

    setIsCopying(true);
    try {
      // Create new shopping list with copied title. Sharing is deliberately not carried
      // over: a copy is a new object, and inheriting a capability token would mint a live
      // secret nobody had chosen to hand out. Matches AnyList, Todoist, Notion and Drive.
      const newListData: ShoppingListRequest = {
        title: `${shoppingList.title} (Kopija)`,
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
            newItemData,
          );
        });

        await Promise.all(copyPromises);
      }

      // Both roots: the copy creates items, and the flat item list feeds watchlist
      // suggestions, which would otherwise not see them until something else refetched.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SHOPPING_LIST_QUERY_KEYS.all,
        }),
        queryClient.invalidateQueries({
          queryKey: SHOPPING_LIST_QUERY_KEYS.itemsAll,
        }),
      ]);

      // Say the copy is private rather than leaving it to be discovered: someone copying
      // a shared list may well assume the same people can still reach it.
      const wasShared =
        !!shoppingList.linkAccess && shoppingList.linkAccess !== "NONE";
      toast.success(
        wasShared
          ? "Popis je kopiran. Kopija nije podijeljena."
          : "Popis za kupnju je uspješno kopiran!",
      );

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
