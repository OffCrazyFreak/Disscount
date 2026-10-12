import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto, ShoppingListRequest } from "@/lib/api/types";
import { stashModalError } from "@/lib/modal/modal-error-bus";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { removeFormDraft } from "@/utils/browser/local-storage";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";

interface IUseShoppingListModalProps {
  shoppingList?: ShoppingListDto | null;
  draftKey: string;
}

export function useShoppingListModal({
  shoppingList,
  draftKey,
}: IUseShoppingListModalProps) {
  const t = useTranslations("shoppingLists");
  const queryClient = useQueryClient();

  const createMutation = shoppingListService.useCreateShoppingList();
  const updateMutation = shoppingListService.useUpdateShoppingList();

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: ShoppingListRequest) {
    closeModalUrl();

    // A paused mutation resolves only on reconnect, so say so now.
    if (!onlineManager.isOnline()) {
      toast.info(t("listModal.offlineToast"));
    }

    try {
      if (shoppingList) {
        await updateMutation.mutateAsync({ id: shoppingList.id, data });
        toast.success(t("listModal.updatedToast"));
      } else {
        await createMutation.mutateAsync(data);
        toast.success(t("listModal.createdToast"));
      }

      removeFormDraft(draftKey);
      await queryClient.invalidateQueries({
        queryKey: SHOPPING_LIST_QUERY_KEYS.all,
      });
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl(
        shoppingList
          ? { name: "shopping-list", action: "edit", id: shoppingList.id }
          : { name: "shopping-list", action: "new" },
      );
    }
  }

  return {
    onSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
  };
}
