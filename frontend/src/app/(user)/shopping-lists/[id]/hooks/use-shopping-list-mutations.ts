import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import {
  openModalUrl,
  type IOpenModalOptions,
} from "@/lib/modal/modal-navigation";

export function useShoppingListMutations(
  listId: string,
  shoppingList?: ShoppingList,
) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();

  const confirmDelete = async () => {
    // Prepare optimistic update: remove item from cache immediately
    await queryClient.cancelQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.me });
    const previous = queryClient.getQueryData<ShoppingList[]>(
      SHOPPING_LIST_QUERY_KEYS.me,
    );
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

  /**
   * Opens the options modal rather than copying on the spot. What a copy should carry is
   * a real question (products, what was already ticked, the sharing settings) and guessing
   * it produced a copy that was wrong on arrival for the common case of shopping the same
   * list again next week.
   */
  function handleCopy(options?: IOpenModalOptions) {
    if (!shoppingList) return;

    openModalUrl(
      { name: "shopping-list", action: "copy", id: shoppingList.id },
      options,
    );
  }

  return {
    deleteShoppingListMutation,
    confirmDelete,
    handleCopy,
  };
}
