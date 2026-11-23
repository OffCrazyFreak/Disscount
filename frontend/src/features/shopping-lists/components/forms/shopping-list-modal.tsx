"use client";

import { Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import ShoppingListModalBody from "@/features/shopping-lists/components/forms/shopping-list-modal-body";
import type { ShoppingListRequest } from "@/lib/api/types";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useShoppingListModal } from "@/features/shopping-lists/hooks/use-shopping-list-modal";
import { useShoppingListEditTarget } from "@/features/shopping-lists/hooks/use-shopping-list-edit-target";
import { useShoppingListForm } from "@/features/shopping-lists/hooks/use-shopping-list-form";

interface IShoppingListModalProps {
  open: boolean;
  action: "new" | "edit";
  id?: string;
}

export default function ShoppingListModal({
  open,
  action,
  id,
}: IShoppingListModalProps) {
  const t = useTranslations("shoppingLists");
  const isEdit = action === "edit" && !!id;

  const { shoppingList, loading, loadError, notFound } =
    useShoppingListEditTarget(isEdit, id);

  const {
    form,
    draftKey,
    isDirty,
    isValid,
    errors,
    restored,
    clearDraft,
    flushDraft,
  } = useShoppingListForm({ open, isEdit, id, shoppingList });

  const { onSubmit, isLoading } = useShoppingListModal({
    shoppingList,
    draftKey,
  });

  function handleSubmit(data: ShoppingListRequest) {
    flushDraft();
    onSubmit(data);
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={isEdit ? t("listModal.titleEdit") : t("listModal.titleNew")}
      description={t("listModal.description")}
      srOnlyDescription
      dirty={isDirty}
      formId="shopping-list-form"
      submitLabel={isEdit ? t("listModal.save") : t("listModal.create")}
      submitIcon={Save}
      submitLoading={isLoading}
      // An untouched rename has nothing to save; isValid alone is stale after the prefill.
      submitDisabled={notFound || loadError || (isEdit && !isDirty)}
      submitIncomplete={!isValid}
      cancelLabel={t("modal.cancel")}
      resetLabel={t("listModal.reset")}
      resetDisabled={!isDirty && !restored}
      onReset={() => {
        clearDraft();
        form.reset();
      }}
    >
      <ShoppingListModalBody
        loading={loading}
        loadError={loadError}
        notFound={notFound}
        form={form}
        rootError={errors.root}
        onSubmit={handleSubmit}
      />
    </ModalShell>
  );
}
