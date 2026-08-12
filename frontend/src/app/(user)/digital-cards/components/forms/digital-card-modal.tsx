"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { applyProblemToForm } from "@/lib/api/problem-details";
import {
  digitalCardFormSchema,
  type DigitalCardFormData,
} from "@/lib/api/schemas/digital-card";
import { takeModalError } from "@/lib/modal/modal-error-bus";
import { takeModalValues } from "@/lib/modal/modal-retry-bus";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useFormDraft } from "@/hooks/use-form-draft";
import {
  getFormDraft,
  removeFormDraftField,
} from "@/utils/browser/local-storage";
import { LOADING_LABELS } from "@/constants/loading-labels";
import extractDominantColor from "@/utils/browser/extract-dominant-color";
import CardNameField from "@/app/(user)/digital-cards/components/forms/card-name-field";
import CardTypeField from "@/app/(user)/digital-cards/components/forms/card-type-field";
import CardImagesField from "@/app/(user)/digital-cards/components/forms/card-images-field";
import CodeField from "@/app/(user)/digital-cards/components/forms/code-field";
import CodePreview from "@/app/(user)/digital-cards/components/forms/code-preview";
import CodeTypeField from "@/app/(user)/digital-cards/components/forms/code-type-field";
import NoteField from "@/app/(user)/digital-cards/components/forms/note-field";
import StoreNameField from "@/app/(user)/digital-cards/components/forms/store-name-field";
import CardColorField from "@/app/(user)/digital-cards/components/forms/color-picker/card-color-field";
import { useCardImages } from "@/app/(user)/digital-cards/hooks/use-card-images";
import { useDigitalCard } from "@/app/(user)/digital-cards/hooks/use-digital-card";
import { useDigitalCardModal } from "@/app/(user)/digital-cards/hooks/use-digital-card-modal";
import {
  CHAIN_BRAND_COLORS,
  DEFAULT_CARD_COLOR,
} from "@/app/(user)/digital-cards/utils/card-colors";

interface IDigitalCardModalProps {
  open: boolean;
  action: "new" | "edit";
  id?: string;
}

// Drafts written before the code was excluded still hold a card number, under the old
// "value" field or the current one. Only those fields go: the rest of a half-finished
// card is the user's work and there is no reason to throw it away with them.
function dropLegacyCode(draftKey: string): void {
  removeFormDraftField(draftKey, "value");
  removeFormDraftField(draftKey, "codeValue");
}

const EMPTY_VALUES: DigitalCardFormData = {
  cardName: "",
  cardType: "loyalty",
  storeName: "",
  chainCode: null,
  codeValue: "",
  codeType: "ean_13",
  cardColor: DEFAULT_CARD_COLOR,
  note: null,
};

export default function DigitalCardModal({
  open,
  action,
  id,
}: IDigitalCardModalProps) {
  const isEdit = action === "edit" && !!id;

  const { card, isLoading, isError, notFound } = useDigitalCard(id, {
    enabled: isEdit,
  });
  const digitalCard = isEdit ? card : null;

  const draftKey = isEdit ? `digital-card.edit.${id}` : "digital-card.new";
  const isReady = !isEdit || !!digitalCard;

  const form = useForm<DigitalCardFormData>({
    resolver: zodResolver(digitalCardFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_VALUES,
  });

  const {
    images,
    setImage,
    resetImages,
    isDirty: imagesDirty,
  } = useCardImages(digitalCard);

  // An existing card's colour is the user's own choice, so nothing may overwrite it.
  const [colorCustomized, setColorCustomized] = useState(isEdit);

  // Draft precedence controls restore order; the isDirty guard is what stops a
  // reload from clobbering an in-progress edit.
  useEffect(() => {
    dropLegacyCode(draftKey);
  }, [draftKey]);

  useEffect(() => {
    if (!digitalCard || form.formState.isDirty) return;

    const base: DigitalCardFormData = {
      cardName: digitalCard.cardName,
      cardType: digitalCard.cardType,
      storeName: digitalCard.storeName,
      chainCode: digitalCard.chainCode,
      codeValue: digitalCard.codeValue,
      codeType: digitalCard.codeType,
      cardColor: digitalCard.cardColor,
      note: digitalCard.note,
    };
    form.reset(base);

    const draft = getFormDraft(draftKey)?.values as
      Partial<DigitalCardFormData> | undefined;
    if (draft && Object.keys(draft).length > 0) {
      form.reset({ ...base, ...draft }, { keepDefaultValues: true });
    }
  }, [digitalCard, draftKey, form]);

  const { restored, clearDraft, flushDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && isReady,
    // New cards auto-restore via the engine; edit modals merge the draft themselves above.
    restore: !isEdit,
    // The card code is sensitive; never persist it to localStorage.
    exclude: ["codeValue"],
  });

  // A failed optimistic save reopened this modal: surface the server error and give back
  // the code the user typed, which the draft deliberately never kept.
  useEffect(() => {
    if (!open) return;

    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form);

    const retry = takeModalValues(draftKey);
    if (typeof retry?.codeValue === "string") {
      form.setValue("codeValue", retry.codeValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [open, draftKey, form]);

  const { onSubmit, isLoading: isSaving } = useDigitalCardModal({
    digitalCard,
    draftKey,
  });

  function suggestColor(hex: string) {
    if (colorCustomized) return;
    form.setValue("cardColor", hex, { shouldDirty: true });
  }

  async function handleColorSource(encoded: string) {
    if (colorCustomized) return;
    const extracted = await extractDominantColor(encoded);
    if (extracted) suggestColor(extracted);
  }

  function handleSubmit(data: DigitalCardFormData) {
    flushDraft();
    onSubmit({ ...data, ...images });
  }

  const loading = isEdit && isLoading;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={isEdit ? "Uredi karticu" : "Nova digitalna kartica"}
      description="Spremi karticu vjernosti i imaj je uvijek pri ruci."
      srOnlyDescription
      size="lg"
      dirty={form.formState.isDirty || imagesDirty}
      formId="digital-card-form"
      // The label carries the pending state: the spinner alone says something is
      // happening, not what.
      submitLabel={
        isSaving
          ? isEdit
            ? LOADING_LABELS.saving
            : LOADING_LABELS.creating
          : isEdit
            ? "Spremi"
            : "Stvori"
      }
      submitIcon={Save}
      submitLoading={isSaving}
      submitDisabled={
        !(form.formState.isDirty || imagesDirty) ||
        !form.formState.isValid ||
        notFound ||
        isError
      }
      cancelLabel="Odustani"
      resetLabel="Resetiraj"
      resetDisabled={!form.formState.isDirty && !imagesDirty && !restored}
      onReset={() => {
        clearDraft();
        resetImages();
        form.reset();
        // Back to a blank card, so the chain and image suggestions become welcome again.
        setColorCustomized(isEdit);
      }}
    >
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Greška pri učitavanju kartice. Pokušaj ponovo.
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
            {form.formState.errors.root && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {form.formState.errors.root.message}
              </div>
            )}

            <CardNameField />

            <StoreNameField
              onChainSelected={(chainCode) => {
                const brandColor = chainCode
                  ? CHAIN_BRAND_COLORS[chainCode]
                  : undefined;
                if (brandColor) suggestColor(brandColor);
              }}
            />

            <CardTypeField />
            <CodeField />
            <CodeTypeField />
            <CodePreview />

            <CardColorField
              isCustomized={colorCustomized}
              onCustomize={() => setColorCustomized(true)}
            />

            <CardImagesField
              images={images}
              onImageChange={setImage}
              onColorSource={handleColorSource}
            />

            <NoteField />
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
