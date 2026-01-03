import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

  const createMutation = shoppingListService.useCreateShoppingList();
  const updateMutation = shoppingListService.useUpdateShoppingList();

  function onSubmit(data: ShoppingListRequest) {
    if (shoppingList) {
      updateMutation.mutate(
        { id: shoppingList.id, data },
        {
          onSuccess: async () => {
            toast.success("Popis za kupnju je uspješno ažuriran!");
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
              message:
                message || "Došlo je do greške prilikom ažuriranja popisa",
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: async () => {
          toast.success("Popis za kupnju je uspješno kreiran!");
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
            message: message || "Došlo je do greške prilikom kreiranja popisa",
          });
        },
      });
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
