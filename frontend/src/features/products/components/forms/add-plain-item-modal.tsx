"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormState } from "react-hook-form";
import { ListPlus } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import FormRootError from "@/components/custom/common/feedback/form-root-error";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { MAX_SHOPPING_LIST_ITEM_NAME_LENGTH } from "@/constants/shopping-list";
import ShoppingListSelector from "@/features/products/components/forms/shopping-list-picker/shopping-list-selector";
import QuantityInput from "@/features/products/components/forms/quantity-input";
import { useAddPlainItemForm } from "@/features/products/hooks/add-to-list/use-add-plain-item-form";

interface IAddPlainItemModalProps {
  open: boolean;
  itemName?: string;
}

const FORM_ID = "add-plain-item-form";
const NAME_INPUT_ID = "add-plain-item-name";
const NAME_ERROR_ID = "add-plain-item-name-error";

export default function AddPlainItemModal({
  open,
  itemName = "",
}: IAddPlainItemModalProps) {
  const t = useTranslations("products");
  const {
    form,
    name,
    setName,
    isNameEdited,
    selection,
    restored,
    resetForm,
    onSubmit,
    isSubmitting,
  } = useAddPlainItemForm(open, itemName);
  const { isValid, isDirty, errors } = useFormState({ control: form.control });
  const [isNameTouched, setNameTouched] = useState(false);
  const isNameMissing = !name.trim();
  const showsNameError = isNameTouched && isNameMissing;

  // The name lives outside the form library, so a submit checks it here and lets the library check the rest.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isNameMissing) {
      void form.handleSubmit(onSubmit)(event);
      return;
    }

    event.preventDefault();
    setNameTouched(true);
    void form.trigger();
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={t("addPlainItem.title")}
      description={t("addPlainItem.description")}
      formId={FORM_ID}
      submitLabel={t("addToList.submit")}
      submitIcon={ListPlus}
      submitLoading={isSubmitting}
      submitIncomplete={isNameMissing || !isValid}
      cancelLabel={t("addToList.cancel")}
      resetLabel={t("addToList.reset")}
      resetDisabled={!isDirty && !restored && !isNameEdited}
      onReset={() => {
        setNameTouched(false);
        resetForm();
      }}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <FormRootError message={errors.root?.message} />

          <div className="space-y-2">
            <Label
              htmlFor={NAME_INPUT_ID}
              className={showsNameError ? "text-destructive" : undefined}
            >
              {t("addPlainItem.nameLabel")}
              <span aria-hidden="true" className="-ml-1 text-destructive">
                *
              </span>
            </Label>
            <Input
              id={NAME_INPUT_ID}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setNameTouched(true)}
              maxLength={MAX_SHOPPING_LIST_ITEM_NAME_LENGTH}
              autoComplete="off"
              aria-required="true"
              aria-invalid={showsNameError}
              aria-describedby={showsNameError ? NAME_ERROR_ID : undefined}
            />
            {showsNameError && (
              <p
                id={NAME_ERROR_ID}
                role="alert"
                className="text-sm text-destructive"
              >
                {t("addPlainItem.nameRequired")}
              </p>
            )}
          </div>

          <ShoppingListSelector
            formField={form}
            isLoadingLists={selection.isLoadingLists}
            sortedShoppingLists={selection.sortedShoppingLists}
            selectedList={selection.selectedList}
            onSelectList={selection.selectList}
          />

          <QuantityInput formField={form} />
        </form>
      </Form>
    </ModalShell>
  );
}
