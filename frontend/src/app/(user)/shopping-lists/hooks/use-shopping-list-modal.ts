import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto, ShoppingListRequest } from "@/lib/api/types";
import type { UseFormSetError } from "react-hook-form";

interface UseShoppingListModalProps {
  shoppingList?: ShoppingListDto | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
  setError: UseFormSetError<ShoppingListRequest>;
  reset: (values?: ShoppingListRequest) => void;
}

export function useShoppingListModal({
  shoppingList,
  onSuccess,
  onOpenChange,
  setError,
  reset,
}: UseShoppingListModalProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("shoppingListDetail.toasts");

  const createMutation = shoppingListService.useCreateShoppingList();
  const updateMutation = shoppingListService.useUpdateShoppingList();

  function onSubmit(data: ShoppingListRequest) {
    // Offline, the mutation is paused and replays on reconnect, so its
    // onSuccess (which closes the modal) won't run for a while. Close the modal
    // now and tell the user instead of leaving the submit button spinning.
    const isOffline = !onlineManager.isOnline();

    if (shoppingList) {
      updateMutation.mutate(
        { id: shoppingList.id, data },
        {
          onSuccess: async () => {
            toast.success(t("listUpdated"));
            await queryClient.invalidateQueries({
              queryKey: ["shoppingLists"],
            });
            await onSuccess?.();
            onOpenChange(false);
          },
          onError: (error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            setError("root", {
              message: message || t("updateListError"),
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: async () => {
          toast.success(t("listCreated"));
          await queryClient.invalidateQueries({
            queryKey: ["shoppingLists"],
          });
          await onSuccess?.();
          onOpenChange(false);
          reset();
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          setError("root", {
            message: message || t("createListError"),
          });
        },
      });
    }

    if (isOffline) {
      toast.info(t("offlineSync"));
      onOpenChange(false);
      if (!shoppingList) reset();
    }
  }

  function handleCancel() {
    reset();
    onOpenChange(false);
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return {
    onSubmit,
    handleCancel,
    isLoading,
  };
}
