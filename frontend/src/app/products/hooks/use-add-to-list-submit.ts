"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto } from "@/lib/api/schemas/shopping-list";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type {
  AddToListFormData,
  IProductPricing,
} from "@/app/products/typings/add-to-list";
import { buildShoppingListItemRequest } from "@/app/products/utils/shopping-list-item-request";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { stashModalError } from "@/lib/modal/modal-error-bus";

interface IUseAddToListSubmitProps {
  ean: string;
  draftKey: string;
  product: ProductResponse | undefined;
  lists: ShoppingListDto[];
  pricing: IProductPricing;
  clearDraft: () => void;
  resetForm: () => void;
}

export function useAddToListSubmit({
  ean,
  draftKey,
  product,
  lists,
  pricing,
  clearDraft,
  resetForm,
}: IUseAddToListSubmitProps) {
  const router = useRouter();
  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  function targetFromList(list: ShoppingListDto) {
    return {
      id: list.id,
      name: list.title,
      isQuantityIncrease:
        list.items?.some((item) => item.name === product?.name) ?? false,
    };
  }

  async function resolveTargetList(data: AddToListFormData) {
    if (data.shoppingListId !== "new") {
      const selected = lists.find((list) => list.id === data.shoppingListId);
      return selected
        ? targetFromList(selected)
        : {
            id: data.shoppingListId,
            name: "popis",
            isQuantityIncrease: false,
          };
    }

    const title = data.customListTitle.trim();

    if (title) {
      const created = await createShoppingListMutation.mutateAsync({ title });
      return { id: created.id, name: title, isQuantityIncrease: false };
    }

    // An older restored draft can keep "new" without a persisted title.
    const newestList = lists[0];
    return newestList ? targetFromList(newestList) : null;
  }

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: AddToListFormData) {
    if (!product) return;
    closeModalUrl();

    try {
      const target = await resolveTargetList(data);

      if (!target) {
        toast.error("Odaberi ili stvori popis za kupnju.");
        openModalUrl({ name: "add-to-list", ean });
        return;
      }

      await addItemMutation.mutateAsync({
        listId: target.id,
        data: buildShoppingListItemRequest(product, data, pricing),
      });

      clearDraft();
      resetForm();
      toast.success(
        target.isQuantityIncrease
          ? `Količina proizvoda je povećana u "${target.name}"`
          : `Proizvod je dodan u "${target.name}"`,
        {
          classNames: {
            actionButton:
              "bg-primary! text-primary-foreground! hover:bg-primary/90!",
          },
          action: {
            label: "Otvori",
            onClick: () =>
              router.push(`/shopping-lists/${encodeURIComponent(target.id)}`),
          },
        },
      );
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl({ name: "add-to-list", ean });
    }
  }

  return {
    onSubmit,
    isSubmitting:
      createShoppingListMutation.isPending || addItemMutation.isPending,
  };
}
