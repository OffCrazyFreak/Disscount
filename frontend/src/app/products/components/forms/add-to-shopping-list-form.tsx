"use client";

import { Activity } from "react";
import { ListPlus, TriangleAlert } from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import { RemoveIconButton } from "@/components/ui/remove-icon-button";
import { Banner } from "@/components/ui/banner";
import ShoppingListSelector from "@/app/products/components/forms/shopping-list-selector";
import QuantityInput from "@/app/products/components/forms/quantity-input";
import MarkAsCheckedCheckbox from "@/app/products/components/forms/mark-as-checked-checkbox";
import StoreChainField from "@/app/products/components/forms/store-chain-field";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useAddToListForm } from "@/app/products/hooks/use-add-to-list-form";

interface IAddToShoppingListFormProps {
  open: boolean;
  ean: string;
}

export default function AddToShoppingListForm({
  open,
  ean,
}: IAddToShoppingListFormProps) {
  const {
    form,
    productQuery,
    product,
    isLoadingLists,
    sortedShoppingLists,
    customListTitle,
    setCustomListTitle,
    selectedList,
    duplicateItem,
    isChecked,
    storePrices,
    averagePrice,
    cheapestStore,
    handleRemoveFromList,
    isRemoving,
    onSubmit,
    isSubmitting,
    restored,
    clearDraft,
  } = useAddToListForm(open, ean);

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Dodaj proizvod u popis za kupnju"
      description="Odaberi popis, količinu i trgovinu."
      srOnlyDescription
      dirty={form.formState.isDirty}
      formId="add-to-list-form"
      submitLabel="Dodaj"
      submitIcon={ListPlus}
      submitLoading={isSubmitting}
      submitDisabled={!product || !form.formState.isValid}
      cancelLabel="Odustani"
      resetLabel="Resetiraj"
      resetDisabled={!form.formState.isDirty && !restored}
      onReset={() => {
        clearDraft();
        form.reset();
      }}
    >
      {productQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !product ? (
        <p className="text-sm text-muted-foreground">
          Proizvod nije pronađen.
        </p>
      ) : (
        <div className="space-y-4">
          <ProductInfoDisplay
            product={product}
            enableActionButtons={false}
            action={
              duplicateItem ? (
                <RemoveIconButton
                  label="Ukloni s ovog popisa"
                  onClick={handleRemoveFromList}
                  loading={isRemoving}
                />
              ) : undefined
            }
          />

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
                <Banner
                  variant="warningSoft"
                  size="lg"
                  icon={TriangleAlert}
                  title="Proizvod već u popisu za kupnju"
                  text={`Ovaj proizvod je već dodan u odabran popis za kupnju. Dodavanjem ovog proizvoda će se samo povećati njegova količina u popisu za kupnju sa ${duplicateItem.amount} na ${duplicateItem.amount + (Number.parseInt(form.watch("amount"), 10) || 0)}.`}
                />
              )}

              <QuantityInput formField={form} />

              <Activity mode={duplicateItem ? "hidden" : "visible"}>
                <MarkAsCheckedCheckbox formField={form} />
              </Activity>

              <Activity
                mode={isChecked && !duplicateItem ? "visible" : "hidden"}
              >
                <StoreChainField
                  formField={form}
                  cheapestStore={cheapestStore}
                  storePrices={storePrices}
                  averagePrice={averagePrice}
                />
              </Activity>
            </form>
          </Form>
        </div>
      )}
    </ModalShell>
  );
}
