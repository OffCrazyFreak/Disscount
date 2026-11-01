"use client";

import { useTranslations } from "next-intl";
import { useFormState, useWatch } from "react-hook-form";
import { ListPlus } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import FormRootError from "@/components/custom/common/form-root-error";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { MAX_SHOPPING_LIST_ITEM_NAME_LENGTH } from "@/constants/shopping-list";
import ShoppingListSelector from "@/app/[locale]/products/components/forms/shopping-list-selector";
import QuantityInput from "@/app/[locale]/products/components/forms/quantity-input";
import { useAddPlainItemForm } from "@/app/[locale]/products/hooks/use-add-plain-item-form";

interface IAddPlainItemModalProps {
  open: boolean;
  itemName?: string;
}

const FORM_ID = "add-plain-item-form";
const NAME_INPUT_ID = "add-plain-item-name";

export default function AddPlainItemModal({
  open,
  itemName = "",
}: IAddPlainItemModalProps) {
  const t = useTranslations("products");
  const { form, name, setName, selection, onSubmit, isSubmitting } =
    useAddPlainItemForm(itemName);
  const { isValid, errors } = useFormState({ control: form.control });
  const shoppingListId = useWatch({
    control: form.control,
    name: "shoppingListId",
  });
  const customListTitle = useWatch({
    control: form.control,
    name: "customListTitle",
  });

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
      submitDisabled={
        !name.trim() ||
        !isValid ||
        (shoppingListId === "new" && !customListTitle.trim())
      }
      cancelLabel={t("addToList.cancel")}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormRootError message={errors.root?.message} />

          <div className="space-y-2">
            <Label htmlFor={NAME_INPUT_ID}>{t("addPlainItem.nameLabel")}</Label>
            <Input
              id={NAME_INPUT_ID}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_SHOPPING_LIST_ITEM_NAME_LENGTH}
              autoComplete="off"
              required
            />
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
