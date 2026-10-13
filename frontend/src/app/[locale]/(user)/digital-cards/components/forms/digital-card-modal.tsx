"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useFormState } from "react-hook-form";

import DigitalCardFields from "@/app/[locale]/(user)/digital-cards/components/forms/digital-card-fields";
import type { CardPhotoChanges } from "@/app/[locale]/(user)/digital-cards/components/forms/digital-card-form-types";
import { useCardPhotoActions } from "@/app/[locale]/(user)/digital-cards/hooks/use-card-photo-actions";
import { useDigitalCardForm } from "@/app/[locale]/(user)/digital-cards/hooks/use-digital-card-form";
import { useDigitalCardFormSubmit } from "@/app/[locale]/(user)/digital-cards/hooks/use-digital-card-form-submit";
import { peekPendingCard } from "@/app/[locale]/(user)/digital-cards/utils/pending-card-stash";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { digitalCardService } from "@/lib/api";
import type { DigitalCardRequest } from "@/lib/api/types";
import { closeModalUrl } from "@/lib/modal/modal-navigation";

interface IDigitalCardModalProps {
  open: boolean;
  action: "new" | "edit";
  id?: string;
}

export default function DigitalCardModal({
  open,
  action,
  id,
}: IDigitalCardModalProps) {
  const isEdit = action === "edit" && !!id;

  // Cards have no by-id read in the UI; the user's list covers cold deep links too.
  const cardsQuery = digitalCardService.useGetMyDigitalCards({
    enabled: isEdit,
  });
  const card = isEdit
    ? (cardsQuery.data?.find((item) => item.id === id) ?? null)
    : null;

  const draftKey = isEdit ? `digital-card.edit.${id}` : "digital-card.new";

  // Client-generated so the create PUT is idempotent and photos have a card to attach to.
  // A retry after a failed create reuses the id the failed attempt used.
  const [newCardId, setNewCardId] = useState(
    () => peekPendingCard(draftKey)?.id ?? crypto.randomUUID(),
  );
  const cardId = isEdit ? id : newCardId;

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
    onSaved: () => setNewCardId(crypto.randomUUID()),
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

  // isPending, not isLoading: a paused offline fetch is pending but not loading, and
  // would otherwise read as "not found" on a cold deep link.
  const offlineWaiting =
    isEdit &&
    !card &&
    cardsQuery.isPending &&
    cardsQuery.fetchStatus === "paused";
  const loading = isEdit && !card && cardsQuery.isPending && !offlineWaiting;
  const loadError = isEdit && !card && (cardsQuery.isError || offlineWaiting);
  const notFound = isEdit && !card && !cardsQuery.isPending && !loadError;
  const changed = isDirty || hasPhotoChanges;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={isEdit ? "Uredi karticu" : "Nova kartica"}
      description="Spremi karticu vjernosti i imaj je uvijek pri ruci."
      srOnlyDescription
      dirty={changed}
      formId="digital-card-form"
      submitLabel="Spremi karticu"
      submitIcon={Save}
      submitLoading={isLoading}
      submitDisabled={!changed || !isValid || notFound || loadError}
      cancelLabel="Odustani"
      resetLabel="Resetiraj"
      resetDisabled={!changed && !restored}
      onReset={() => {
        clearDraft();
        form.reset();
        setPhotoChanges({});
      }}
    >
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : loadError ? (
        <p className="text-sm text-muted-foreground">
          {offlineWaiting
            ? "Izvan si mreže, a ova kartica još nije spremljena na uređaju. Spoji se na mrežu i pokušaj ponovo."
            : "Greška pri učitavanju kartice. Pokušaj ponovo."}
        </p>
      ) : notFound ? (
        <p className="text-sm text-muted-foreground">
          Kartica nije pronađena. Možda je obrisana.
        </p>
      ) : (
        <Form {...form}>
          <form
            id="digital-card-form"
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
      )}
    </ModalShell>
  );
}
