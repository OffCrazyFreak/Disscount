import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto, ShoppingListRequest } from "@/lib/api/types";
import { stashModalError } from "@/lib/modal/modal-error-bus";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { removeFormDraft } from "@/utils/browser/local-storage";

interface UseShoppingListModalProps {
  shoppingList?: ShoppingListDto | null;
  draftKey: string;
}

export function useShoppingListModal({
  shoppingList,
  draftKey,
}: UseShoppingListModalProps) {
  const queryClient = useQueryClient();

  const createMutation = shoppingListService.useCreateShoppingList();
  const updateMutation = shoppingListService.useUpdateShoppingList();

  // Optimistic close: the modal closes immediately and reopens (with the draft
  // still holding the values) only if the request fails.
  async function onSubmit(data: ShoppingListRequest) {
    closeModalUrl();

    // Offline, the mutation is paused and replays on reconnect, so the await
    // below resolves only once the sync happens; tell the user right away.
    if (!onlineManager.isOnline()) {
      toast.info(
        "Izvan ste mreže - promjena će se sinkronizirati kad se vratite na mrežu."
      );
    }

    try {
      if (shoppingList) {
        await updateMutation.mutateAsync({ id: shoppingList.id, data });
        toast.success("Popis za kupnju je uspješno ažuriran!");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Popis za kupnju je uspješno kreiran!");
      }

      removeFormDraft(draftKey);
      await queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl(
        shoppingList
          ? { name: "shopping-list", action: "edit", id: shoppingList.id }
          : { name: "shopping-list", action: "new" }
      );
    }
  }

  return {
    onSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
  };
}
