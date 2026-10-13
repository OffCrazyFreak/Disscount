"use client";

import { Activity } from "react";
import { useTranslations } from "next-intl";
import { useFormState, useWatch } from "react-hook-form";
import { ListPlus, TriangleAlert } from "lucide-react";

import ListPen from "@/components/custom/icons/list-pen";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import ProductInfoDisplay from "@/app/[locale]/products/components/product-info-display";
import RemoveIconButton from "@/components/custom/common/remove-icon-button";
import { Banner } from "@/components/custom/common/banner";
import ShoppingListSelector from "@/app/[locale]/products/components/forms/shopping-list-selector";
import QuantityInput from "@/app/[locale]/products/components/forms/quantity-input";
import MarkAsCheckedCheckbox from "@/app/[locale]/products/components/forms/mark-as-checked-checkbox";
import StoreChainField from "@/app/[locale]/products/components/forms/store-chain-field";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useAddToListForm } from "@/app/[locale]/products/hooks/use-add-to-list-form";

interface IAddToShoppingListFormProps {
  open: boolean;
  ean: string;
}

export default function AddToShoppingListForm({
  open,
  ean,
}: IAddToShoppingListFormProps) {
  const t = useTranslations("products");
  const {
    form,
    productQuery,
    product,
    isLoadingLists,
    sortedShoppingLists,
    customListTitle,
    selectedList,
    selectList,
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
    resetForm,
  } = useAddToListForm(open, ean);
  const { isDirty, isValid, errors } = useFormState({ control: form.control });
  const shoppingListId = useWatch({
    control: form.control,
    name: "shoppingListId",
  });
  const amount = useWatch({ control: form.control, name: "amount" });

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={t("addToList.title")}
      description={t("addToList.description")}
      srOnlyDescription
      dirty={isDirty}
      formId="add-to-list-form"
      submitLabel={t("addToList.submit")}
      // The product is already on the chosen list, so submitting edits that entry
      // rather than adding a second one.
      submitIcon={duplicateItem ? ListPen : ListPlus}
      submitLoading={isSubmitting}
      submitDisabled={
        !product ||
        !isValid ||
        (shoppingListId === "new" && !customListTitle.trim())
      }
      cancelLabel={t("addToList.cancel")}
      resetLabel={t("addToList.reset")}
      resetDisabled={!isDirty && !restored}
      onReset={() => {
        clearDraft();
        resetForm();
      }}
    >
      {productQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !product ? (
        <p className="text-sm text-muted-foreground">
          {t("addToList.productNotFound")}
        </p>
      ) : (
        <div className="space-y-4">
          <ProductInfoDisplay
            product={product}
            enableActionButtons={false}
            action={
              duplicateItem ? (
                <RemoveIconButton
                  label={t("addToList.removeFromList")}
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
              {errors.root && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {errors.root.message}
                </div>
              )}

              <ShoppingListSelector
                formField={form}
                isLoadingLists={isLoadingLists}
                sortedShoppingLists={sortedShoppingLists}
                selectedList={selectedList}
                onSelectList={selectList}
              />

              {duplicateItem && (
                <Banner
                  variant="warningSoft"
                  size="lg"
                  icon={TriangleAlert}
                  title={t("addToList.duplicateTitle")}
                  text={t("addToList.duplicateText", {
                    current: duplicateItem.amount,
                    next:
                      duplicateItem.amount + (Number.parseInt(amount, 10) || 0),
                  })}
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
