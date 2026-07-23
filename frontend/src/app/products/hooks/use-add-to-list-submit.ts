"use client";

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
  customListTitle: string;
  pricing: IProductPricing;
  clearDraft: () => void;
}

export function useAddToListSubmit({
  ean,
  draftKey,
  product,
  lists,
  customListTitle,
  pricing,
  clearDraft,
}: IUseAddToListSubmitProps) {
  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  async function resolveTargetList(selectedId: string) {
    if (selectedId !== "new") {
      const selected = lists.find((list) => list.id === selectedId);
      return { id: selectedId, name: selected?.title || "popis" };
    }

    const title = customListTitle.trim();

    if (title) {
      const created = await createShoppingListMutation.mutateAsync({
        title,
        isPublic: false,
      });
      toast.success(`Popis za kupnju "${title}" je stvoren`);
      return { id: created.id, name: title };
    }

    // A restored draft can keep "new" without its un-persisted title.
    const newestList = lists[0];
    return newestList ? { id: newestList.id, name: newestList.title } : null;
  }

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: AddToListFormData) {
    if (!product) return;
    closeModalUrl();

    try {
      const target = await resolveTargetList(data.shoppingListId);

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
      toast.success(`Proizvod je dodan u "${target.name}"`);
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
