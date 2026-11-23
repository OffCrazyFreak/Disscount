"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormState } from "react-hook-form";

import CardLoadGate from "@/features/digital-cards/components/forms/card-load-gate";
import DigitalCardFields from "@/features/digital-cards/components/forms/digital-card-fields";
import type { CardPhotoChanges } from "@/features/digital-cards/components/forms/digital-card-form-types";
import { useCardDraftIdentity } from "@/features/digital-cards/hooks/use-card-draft-identity";
import { useCardPhotoActions } from "@/features/digital-cards/hooks/use-card-photo-actions";
import { useDigitalCardForm } from "@/features/digital-cards/hooks/use-digital-card-form";
import { useDigitalCardFormSubmit } from "@/features/digital-cards/hooks/use-digital-card-form-submit";
import { useEditCard } from "@/features/digital-cards/hooks/use-edit-card";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import type { DigitalCardRequest } from "@/lib/api/types";
import { closeModalUrl } from "@/lib/modal/modal-navigation";

interface IDigitalCardModalProps {
  open: boolean;
  action: "new" | "edit";
  id?: string;
}

// An untouched edit has nothing to save, and isValid is stale after the prefill; invalid stays tappable.
function isSubmitBlocked(
  loadState: { notFound: boolean; loadError: boolean },
  isUntouchedEdit: boolean,
): boolean {
  return loadState.notFound || loadState.loadError || isUntouchedEdit;
}

export default function DigitalCardModal({
  open,
  action,
  id,
}: IDigitalCardModalProps) {
  const t = useTranslations("digitalCards.form");
  const isEdit = action === "edit" && !!id;
  const { card, loadState } = useEditCard(isEdit, id);

  const { draftKey, cardId, renewCardId } = useCardDraftIdentity(
    isEdit ? id : undefined,
  );

  const [photoChanges, setPhotoChanges] = useState<CardPhotoChanges>({});

  const { form, restored, clearDraft, flushDraft } = useDigitalCardForm({
    open,
    isEdit,
    card,
    draftKey,
    onRestorePhotos: setPhotoChanges,
  });
  // This component did not call useForm, so it subscribes instead of reading form.formState.
  const { isDirty, isValid, errors } = useFormState({ control: form.control });

  const hasPhotoChanges = Object.keys(photoChanges).length > 0;
  const photoActions = useCardPhotoActions(cardId);

  const { onSubmit, isLoading } = useDigitalCardFormSubmit({
    cardId,
    isEdit,
    draftKey,
    photoActions,
    onSaved: renewCardId,
  });

  function handleSubmit(data: DigitalCardRequest) {
    flushDraft();
    void onSubmit(data, photoChanges);
    // The submit owns these files now; a failed save puts them back via the pending stash.
    setPhotoChanges({});
  }

  function handlePhotoChange(
    slot: keyof CardPhotoChanges,
    change: File | null | undefined,
  ) {
    setPhotoChanges((current) => {
      const { [slot]: _discarded, ...rest } = current;
      return change === undefined ? rest : { ...rest, [slot]: change };
    });
  }

  const changed = isDirty || hasPhotoChanges;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={isEdit ? t("editTitle") : t("newTitle")}
      description={t("description")}
      srOnlyDescription
      dirty={changed}
      formId="digital-card-form"
      submitLabel={t("save")}
      submitIcon={Save}
      submitLoading={isLoading}
      submitDisabled={isSubmitBlocked(loadState, isEdit && !changed)}
      submitIncomplete={!isValid}
      cancelLabel={t("cancel")}
      resetLabel={t("reset")}
      resetDisabled={!changed && !restored}
      onReset={() => {
        clearDraft();
        form.reset();
        setPhotoChanges({});
      }}
    >
      <CardLoadGate loadState={loadState}>
        <Form {...form}>
          <form
            id="digital-card-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {errors.root && (
              <div
                role="alert"
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3"
              >
                {errors.root.message}
              </div>
            )}

            <DigitalCardFields
              isEdit={isEdit}
              photos={{
                cardId,
                card,
                changes: photoChanges,
                status: photoActions.status,
                onChange: handlePhotoChange,
              }}
            />
          </form>
        </Form>
      </CardLoadGate>
    </ModalShell>
  );
}
