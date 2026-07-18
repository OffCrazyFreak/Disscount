"use client";

import { useState, useEffect, Activity } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { ModalShell } from "@/components/ui/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { shoppingListService } from "@/lib/api";
import cijeneService from "@/lib/cijene-api";
import {
  ShoppingListItemDto,
  ShoppingListItemRequest,
} from "@/lib/api/schemas/shopping-list-item";
import { useQueryClient } from "@tanstack/react-query";
import {
  AddToListFormData,
  addToListFormSchema,
} from "@/app/products/typings/add-to-list";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import FormWarning from "@/components/custom/form-warning";
import ShoppingListSelector from "@/app/products/components/forms/shopping-list-selector";
import QuantityInput from "@/app/products/components/forms/quantity-input";
import MarkAsCheckedCheckbox from "@/app/products/components/forms/mark-as-checked-checkbox";
import StoreChainSelect from "@/components/custom/store-chain-select";
import { useUser } from "@/context/user-context";
import { useAddToListPrices } from "@/app/products/hooks/use-add-to-list-prices";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { stashModalError, takeModalError } from "@/lib/modal/modal-error-bus";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { removeFormDraft } from "@/utils/browser/local-storage";

interface AddToShoppingListFormProps {
  open: boolean;
  ean: string;
}

export default function AddToShoppingListForm({
  open,
  ean,
}: AddToShoppingListFormProps) {
  const [customListTitle, setCustomListTitle] = useState("");

  const queryClient = useQueryClient();
  const { user } = useUser();
  const draftKey = `add-to-list.${ean}`;

  // Same query key/staleTime as the product page, so this is a cache hit
  // everywhere except cold deep links.
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const product = productQuery.data;

  const { data: shoppingLists = [], isLoading: isLoadingLists } =
    shoppingListService.useGetCurrentUserShoppingLists({ enabled: !!user });

  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  const form = useForm<AddToListFormData>({
    resolver: zodResolver(addToListFormSchema),
    defaultValues: {
      shoppingListId: "",
      amount: 1,
      isChecked: false,
      chainCode: null,
    },
  });

  const { storePrices, averagePrice, cheapestStore } = useAddToListPrices(
    product,
    user?.pinnedStores ?? undefined,
    form
  );

  // Get selected shopping list details to check for duplicates
  const selectedListId = form.watch("shoppingListId");
  const { data: selectedShoppingList } =
    shoppingListService.useGetShoppingListById(selectedListId);

  const duplicateItem: ShoppingListItemDto | undefined =
    selectedShoppingList?.items?.find((item) => item.ean === product?.ean);

  const sortedShoppingLists = shoppingLists
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  // Default to the most recently updated list once lists load
  useEffect(() => {
    if (sortedShoppingLists.length > 0 && !form.getValues("shoppingListId")) {
      form.setValue("shoppingListId", sortedShoppingLists[0].id);
    }
  }, [sortedShoppingLists, form]);

  // Reset selection if the selected list was deleted
  useEffect(() => {
    const currentSelectedId = form.getValues("shoppingListId");
    if (
      currentSelectedId &&
      currentSelectedId !== "new" &&
      !sortedShoppingLists.find((list) => list.id === currentSelectedId)
    ) {
      form.setValue(
        "shoppingListId",
        sortedShoppingLists.length > 0 ? sortedShoppingLists[0].id : ""
      );
    }
  }, [sortedShoppingLists, form]);

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form.setError);
  }, [open, draftKey, form]);

  const isChecked = form.watch("isChecked");

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: AddToListFormData) {
    if (!product) return;
    closeModalUrl();

    try {
      let listId = data.shoppingListId;
      let listName =
        sortedShoppingLists.find((list) => list.id === listId)?.title ||
        "popis";

      if (data.shoppingListId === "new" && customListTitle) {
        const newList = await createShoppingListMutation.mutateAsync({
          title: customListTitle,
          isPublic: false,
        });
        toast.success(`Popis za kupnju "${customListTitle}" je stvoren`);
        listId = newList.id;
        listName = customListTitle;
      }

      const itemRequest: ShoppingListItemRequest = {
        ean: product.ean,
        name: product.name || "",
        brand: product.brand || undefined,
        quantity: product.quantity || undefined,
        unit: product.unit || undefined,
        amount: data.amount,
        isChecked: data.isChecked,
      };

      // Only checked items carry price/store info
      if (data.isChecked) {
        const selectedChainCode = data.chainCode || cheapestStore;
        if (selectedChainCode) {
          itemRequest.chainCode = selectedChainCode;
          itemRequest.avgPrice = averagePrice || undefined;
          itemRequest.storePrice = storePrices[selectedChainCode];
        }
      }

      await addItemMutation.mutateAsync({ listId, data: itemRequest });

      queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
      queryClient.invalidateQueries({ queryKey: ["shoppingListItems"] });
      removeFormDraft(draftKey);
      toast.success(`Proizvod je dodan u "${listName}"`);
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl({ name: "add-to-list", ean });
    }
  }

  const selectedList = sortedShoppingLists.find(
    (list) => list.id === selectedListId
  );

  const isSubmitting =
    createShoppingListMutation.isPending || addItemMutation.isPending;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Dodaj proizvod u popis za kupnju"
      description="Odaberi popis, količinu i trgovinu."
      srOnlyDescription
      formId="add-to-list-form"
      submitLabel="Dodaj"
      submitLoading={isSubmitting}
      submitDisabled={!product}
      cancelLabel="Odustani"
    >
      {productQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !product ? (
        <p className="text-sm text-muted-foreground">
          Proizvod nije pronađen.
        </p>
      ) : (
        <div className="space-y-4">
          <ProductInfoDisplay product={product} enableActionButtons={false} />

          <Form {...form}>
            <form
              id="add-to-list-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {form.formState.errors.root && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {form.formState.errors.root.message}
                </div>
              )}

              <ShoppingListSelector
                formField={form}
                isLoadingLists={isLoadingLists}
                sortedShoppingLists={sortedShoppingLists}
                customListTitle={customListTitle}
                setCustomListTitle={setCustomListTitle}
                selectedList={selectedList}
              />

              {duplicateItem && (
                <FormWarning
                  title="Proizvod već u popisu za kupnju"
                  text={`Ovaj proizvod je već dodan u odabran popis za kupnju. Dodavanjem ovog proizvoda će se samo povećati njegova količina u popisu za kupnju sa ${duplicateItem.amount} na ${duplicateItem.amount + form.watch("amount")}.`}
                />
              )}

              <QuantityInput formField={form} />

              <Activity mode={duplicateItem ? "hidden" : "visible"}>
                <MarkAsCheckedCheckbox formField={form} />
              </Activity>

              <Activity
                mode={isChecked && !duplicateItem ? "visible" : "hidden"}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trgovina</label>
                  <StoreChainSelect
                    value={form.watch("chainCode") || ""}
                    onChange={(value) => form.setValue("chainCode", value)}
                    defaultValue={cheapestStore}
                    storePrices={storePrices}
                    averagePrice={averagePrice || undefined}
                    isChecked={false}
                    classname="w-full"
                  />
                </div>
              </Activity>
            </form>
          </Form>
        </div>
      )}
    </ModalShell>
  );
}
