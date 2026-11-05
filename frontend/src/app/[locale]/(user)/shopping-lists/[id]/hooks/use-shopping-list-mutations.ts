import { useRouter } from "@/i18n/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { shoppingListService } from "@/lib/api";
import { problemMessage } from "@/lib/api/problem-details";
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
  const t = useTranslations("shoppingListDetail");
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();

  const confirmDelete = async () => {
    await queryClient.cancelQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.me });
    const previous = queryClient.getQueryData<ShoppingList[]>(
      SHOPPING_LIST_QUERY_KEYS.me,
    );
    queryClient.setQueryData<ShoppingList[] | undefined>(
      SHOPPING_LIST_QUERY_KEYS.me,
      (old: ShoppingList[] | undefined) =>
        old ? old.filter((l) => l.id !== listId) : [],
    );

    // Awaited because per-call callbacks need a live observer, and the actions sheet unmounts as this fires.
    try {
      await deleteShoppingListMutation.mutateAsync(listId);

      toast.success(t("toasts.listDeleted"));
      router.push("/shopping-lists");
    } catch (error) {
      if (previous) {
        queryClient.setQueryData(SHOPPING_LIST_QUERY_KEYS.me, previous);
      }
      toast.error(problemMessage(error, t("toasts.listDeleteFailed")));
    } finally {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.me });
    }
  };

  /** Opens the options modal because guessing what a copy carries was wrong for shopping a list again. */
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
