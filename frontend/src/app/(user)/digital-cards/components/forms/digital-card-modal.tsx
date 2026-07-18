"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ModalShell } from "@/components/ui/modal-shell";
import { Form } from "@/components/ui/form";
import { DraftRestoredChip } from "@/components/custom/modal-router/draft-restored-chip";
import { DigitalCardFields } from "@/app/(user)/digital-cards/components/forms/digital-card-fields";
import { useDigitalCardModal } from "@/app/(user)/digital-cards/components/forms/use-digital-card-modal";
import { digitalCardService } from "@/lib/api";
import {
  DigitalCardRequest,
  digitalCardRequestSchema,
} from "@/lib/api/types";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { takeModalError } from "@/lib/modal/modal-error-bus";
import { useFormDraft } from "@/hooks/use-form-draft";

interface DigitalCardModalProps {
  open: boolean;
  action: "new" | "edit";
  id?: string;
}

const EMPTY_VALUES: DigitalCardRequest = {
  title: "",
  value: "",
  type: "loyalty",
  codeType: "barcode",
  color: undefined,
  note: undefined,
};

export default function DigitalCardModal({
  open,
  action,
  id,
}: DigitalCardModalProps) {
  const isEdit = action === "edit" && !!id;

  // Cards have no by-id endpoint; the user's list query covers cold deep links.
  const cardsQuery = digitalCardService.useGetUserDigitalCards({
    enabled: isEdit,
  });
  const digitalCard = isEdit
    ? (cardsQuery.data?.find((card) => card.id === id) ?? null)
    : null;

  const draftKey = isEdit ? `digital-card.edit.${id}` : "digital-card.new";
  const isReady = !isEdit || !!digitalCard;

  const form = useForm<DigitalCardRequest>({
    resolver: zodResolver(digitalCardRequestSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!digitalCard) return;
    form.reset({
      title: digitalCard.title,
      value: digitalCard.value,
      type: digitalCard.type,
      codeType: digitalCard.codeType,
      color: digitalCard.color,
      note: digitalCard.note,
    });
  }, [digitalCard, form]);

  const { restored, clearDraft, flushDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && isReady,
  });

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form.setError);
  }, [open, draftKey, form]);

  const { onSubmit, isLoading } = useDigitalCardModal({ digitalCard, draftKey });

  function handleSubmit(data: DigitalCardRequest) {
    flushDraft();
    onSubmit(data);
  }

  const notFound = isEdit && !digitalCard && !cardsQuery.isLoading;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={isEdit ? "Uredi digitalnu karticu" : "Nova digitalna kartica"}
      description="Spremi karticu vjernosti i imaj je uvijek pri ruci."
      srOnlyDescription
      formId="digital-card-form"
      submitLabel={isEdit ? "Ažuriraj" : "Stvori"}
      submitLoading={isLoading}
      submitDisabled={!form.formState.isDirty || notFound}
      cancelLabel="Odustani"
      footerStart={restored ? <DraftRestoredChip /> : undefined}
    >
      {notFound ? (
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
            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {form.formState.errors.root.message}
              </div>
            )}

            <DigitalCardFields />

            {restored && (
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  form.reset();
                }}
                className="cursor-pointer text-xs text-muted-foreground underline hover:text-primary"
              >
                Odbaci izmjene i vrati spremljene vrijednosti
              </button>
            )}
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
