import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { CardPhotoChanges } from "@/app/[locale]/(user)/digital-cards/components/forms/digital-card-form-types";
import { cardRequestFromDto } from "@/app/[locale]/(user)/digital-cards/utils/card-request-from-dto";
import { EMPTY_CARD_VALUES } from "@/app/[locale]/(user)/digital-cards/utils/digital-card-form-values";
import { takePendingCard } from "@/app/[locale]/(user)/digital-cards/utils/pending-card-stash";
import { useFormDraft } from "@/hooks/use-form-draft";
import { applyProblemToForm } from "@/lib/api/problem-details";
import {
  digitalCardRequestSchema,
  type DigitalCardDto,
  type DigitalCardRequest,
} from "@/lib/api/types";
import { takeModalError } from "@/lib/modal/modal-error-bus";
import { getFormDraft } from "@/utils/browser/local-storage";

interface IUseDigitalCardFormProps {
  open: boolean;
  isEdit: boolean;
  card: DigitalCardDto | null;
  draftKey: string;
  onRestorePhotos: (photos: CardPhotoChanges) => void;
}

export function useDigitalCardForm({
  open,
  isEdit,
  card,
  draftKey,
  onRestorePhotos,
}: IUseDigitalCardFormProps) {
  const t = useTranslations("digitalCards.form");
  const form = useForm<DigitalCardRequest>({
    resolver: zodResolver(digitalCardRequestSchema),
    mode: "onChange",
    defaultValues: EMPTY_CARD_VALUES,
  });

  // Destructured, never read inline: formState is a Proxy that subscribes per field.
  const { isDirty } = form.formState;

  // Draft wins over the loaded card, so an in-progress edit is never clobbered.
  useEffect(() => {
    if (!card || isDirty) return;

    const base = cardRequestFromDto(card);
    form.reset(base);

    const draft = getFormDraft(draftKey)?.values as
      Partial<DigitalCardRequest> | undefined;
    if (draft && Object.keys(draft).length > 0) {
      form.reset({ ...base, ...draft }, { keepDefaultValues: true });
    }

    // A saved card with a bad value would otherwise show only a disabled Save.
    void form.trigger();
    // isDirty is read on purpose but must not retrigger the seed: adding it would
    // reset the form the moment the user's first keystroke flips it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, draftKey, form]);

  const draftControls = useFormDraft({
    draftKey,
    form,
    enabled: open && (!isEdit || !!card),
    // New cards auto-restore via the engine; edit modals merge the draft themselves above.
    restore: !isEdit,
    // The card number is sensitive; it never reaches localStorage.
    exclude: ["codeValue", "barcodeValue"],
  });

  // A failed optimistic save reopened this modal: put the numbers back, then show the error.
  useEffect(() => {
    if (!open) return;

    const error = takeModalError(draftKey);
    const pending = takePendingCard(draftKey);
    if (!pending && !error) return;

    void (async () => {
      if (pending) {
        form.setValue("codeValue", pending.codeValue, { shouldDirty: true });
        form.setValue("barcodeValue", pending.barcodeValue, {
          shouldDirty: true,
        });
        // Validated before the server error lands, or that validation would wipe it.
        if (pending.photos) onRestorePhotos(pending.photos);
        await form.trigger(["codeValue", "barcodeValue"]);
      }
      if (error) applyProblemToForm(error, form, undefined, t("saveFailed"));
    })();
  }, [open, draftKey, form, onRestorePhotos, t]);

  return { form, ...draftControls };
}
