"use client";

import { useState, useEffect, Activity } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { shoppingListService } from "@/lib/api";
import { ShoppingListRequest } from "@/lib/api/schemas/shopping-list";
import { ShoppingListItemRequest } from "@/lib/api/schemas/shopping-list-item";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useQueryClient } from "@tanstack/react-query";
import {
  AddToListFormData,
  addToListFormSchema,
} from "@/app/products/typings/add-to-list";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import DuplicateWarning from "@/app/products/components/forms/duplicate-warning";
import ShoppingListSelector from "@/app/products/components/forms/shopping-list-selector";
import QuantityInput from "@/app/products/components/forms/quantity-input";
import MarkAsCheckedCheckbox from "@/app/products/components/forms/mark-as-checked-checkbox";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import StoreChainSelect from "@/components/custom/store-chain-select";
import {
  getAveragePriceForItem,
  getStorePricesForItem,
  findCheapestStoreForItem,
} from "@/utils/shopping-list-utils";

interface IAddToShoppingListFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResponse;
}

export default function AddToShoppingListForm({
  isOpen,
  onOpenChange,
  product,
}: IAddToShoppingListFormProps) {
  const [customListTitle, setCustomListTitle] = useState("");
  const [storePrices, setStorePrices] = useState<Record<string, number>>({});
  const [averagePrice, setAveragePrice] = useState<number | null>(null);
  const [cheapestStore, setCheapestStore] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: shoppingLists = [], isLoading: isLoadingLists } =
    shoppingListService.useGetCurrentUserShoppingLists();

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

  // Get selected shopping list details to check for duplicates
  const selectedListId = form.watch("shoppingListId");
  const { data: selectedShoppingList } =
    shoppingListService.useGetShoppingListById(selectedListId);

  // Check for duplicate EAN in selected list
  const duplicateItem = selectedShoppingList?.items?.find(
    (item) => item.ean === product?.ean
  );
  const hasDuplicateEan = !!duplicateItem;

  // Sort shopping lists by updatedAt (newest first) and set default selection
  const sortedShoppingLists = shoppingLists
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  // Set default selection when lists are loaded or when modal opens
  useEffect(() => {
    if (
      isOpen &&
      sortedShoppingLists.length > 0 &&
      !form.getValues("shoppingListId")
    ) {
      form.setValue("shoppingListId", sortedShoppingLists[0].id);
    }
  }, [isOpen, sortedShoppingLists, form]);

  // Watch isChecked to toggle visibility
  const isChecked = form.watch("isChecked");

  // Fetch store prices once when form opens
  useEffect(() => {
    if (isOpen && product) {
      const fetchPrices = async () => {
        try {
          const tempItem = {
            id: "",
            shoppingListId: "",
            ean: product.ean,
            name: product.name || "",
            brand: product.brand || undefined,
            quantity: product.quantity || undefined,
            unit: product.unit || undefined,
            amount: 1,
            isChecked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedByUserId: null,
            avgPrice: null,
            storePrice: null,
            chainCode: null,
          };

          const [avgPrice, prices, cheapest] = await Promise.all([
            getAveragePriceForItem(tempItem),
            getStorePricesForItem(tempItem),
            findCheapestStoreForItem(tempItem, user?.pinnedStores || undefined),
          ]);

          setAveragePrice(avgPrice);
          setStorePrices(prices);
          setCheapestStore(cheapest);

          // Set default chain code to cheapest store
          if (cheapest && !form.getValues("chainCode")) {
            form.setValue("chainCode", cheapest);
          }
        } catch (error) {
          console.error("Error fetching prices:", error);
        }
      };

      fetchPrices();
    }
  }, [isOpen, product, user?.pinnedStores, form]);

  async function onSubmit(data: AddToListFormData) {
    if (!product) return;

    const proceedToAdd = async (listId: string) => {
      const itemRequest: ShoppingListItemRequest = {
        ean: product.ean,
        name: product.name || "",
        brand: product.brand || undefined,
        quantity: product.quantity || undefined,
        unit: product.unit || undefined,
        amount: data.amount,
        isChecked: data.isChecked,
      };

      // If the item is marked as checked, include price information and store
      if (data.isChecked && data.chainCode) {
        itemRequest.chainCode = data.chainCode;
        itemRequest.avgPrice = averagePrice || undefined;
        itemRequest.storePrice = storePrices[data.chainCode];
      }
      // If unchecked, explicitly don't send chainCode, avgPrice, or storePrice

      addItemMutation.mutate(
        {
          listId,
          data: itemRequest,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
            queryClient.invalidateQueries({ queryKey: ["shoppingListItems"] });

            const listName =
              data.shoppingListId === "new"
                ? customListTitle
                : sortedShoppingLists.find((list) => list.id === listId)
                    ?.title || "popis";

            toast.success(`Proizvod je dodan u "${listName}"`);

            // Reset form and close modal
            form.reset({
              shoppingListId:
                sortedShoppingLists.length > 0 ? sortedShoppingLists[0].id : "",
              amount: 1,
              isChecked: false,
              chainCode: null,
            });
            setCustomListTitle("");
            setStorePrices({});
            setAveragePrice(null);
            setCheapestStore(null);

            onOpenChange(false);
          },
          onError: (err) => {
            toast.error("Greška pri dodavanju na popis: " + err.message);
          },
        }
      );
    };

    // If creating a new list, create it first, then add the item in onSuccess
    if (data.shoppingListId === "new" && customListTitle) {
      const createRequest: ShoppingListRequest = {
        title: customListTitle,
        isPublic: false,
      };

      createShoppingListMutation.mutate(createRequest, {
        onSuccess: (newList) => {
          toast.success(`Popis za kupnju "${customListTitle}" je stvoren`);
          proceedToAdd(newList.id);
        },
        onError: (err) => {
          toast.error("Greška pri stvaranju popisa za kupnju: " + err.message);
        },
      });
    } else {
      proceedToAdd(data.shoppingListId);
    }
  }

  function handleCancel() {
    form.reset();
    setCustomListTitle("");
    onOpenChange(false);
  }

  const selectedList = sortedShoppingLists.find(
    (list) => list.id === form.watch("shoppingListId")
  );

  const isSubmitting =
    createShoppingListMutation.isPending || addItemMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="add-to-shopping-list-form">
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">
            Dodaj proizvod u popis za kupnju
          </DialogTitle>
        </DialogHeader>

        {/* Product Information Display */}
        <ProductInfoDisplay product={product} />

        {/* Warning for duplicate EAN */}
        <DuplicateWarning
          hasDuplicateEan={hasDuplicateEan}
          selectedListId={selectedListId}
          duplicateItem={duplicateItem}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ShoppingListSelector
              formField={form}
              isLoadingLists={isLoadingLists}
              sortedShoppingLists={sortedShoppingLists}
              customListTitle={customListTitle}
              setCustomListTitle={setCustomListTitle}
              selectedList={selectedList}
            />

            <QuantityInput formField={form} />

            <Activity mode={hasDuplicateEan ? "hidden" : "visible"}>
              <MarkAsCheckedCheckbox formField={form} />
            </Activity>

            <Activity
              mode={isChecked && !hasDuplicateEan ? "visible" : "hidden"}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Trgovina</label>
                <StoreChainSelect
                  value={form.watch("chainCode") || ""}
                  onChange={(value) => form.setValue("chainCode", value)}
                  storePrices={storePrices}
                  averagePrice={averagePrice || undefined}
                  isChecked={false}
                  classname="w-full"
                />
              </div>
            </Activity>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                effect="ringHover"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Odustani
              </Button>

              <Button
                type="submit"
                variant="default"
                effect="expandIcon"
                icon={Save}
                iconPlacement="right"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Dodavanje"
              >
                Dodaj
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
