import { onlineManager } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { CardPhotoChanges } from "@/features/digital-cards/components/forms/digital-card-form-types";
import type { IQueuedCardPhoto } from "@/features/digital-cards/hooks/use-card-photo-actions";
import { toCardRequest } from "@/features/digital-cards/utils/form/digital-card-form-values";
import { stashPendingCard } from "@/features/digital-cards/utils/pending-card-stash";
import { CARD_PHOTO_SLOTS, type CardPhotoSlot } from "@/constants/card-codes";
import { digitalCardService } from "@/lib/api";
import type { DigitalCardRequest } from "@/lib/api/types";
import { stashModalError } from "@/lib/modal/modal-error-bus";
import { isLimitReached } from "@/lib/limits/limit-reached";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import {
  getFormDraft,
  removeFormDraft,
  setFormDraft,
} from "@/utils/browser/local-storage";

interface IUseDigitalCardFormSubmitProps {
  cardId: string;
  isEdit: boolean;
  draftKey: string;
  // The modal lingers briefly after closing, so a quick reopen would reuse a saved card's id.
  onSaved: () => void;
  photoActions: {
    queueUpload: (
      slot: CardPhotoSlot,
      file: File,
    ) => Promise<IQueuedCardPhoto | undefined>;
    queueRemoval: (
      slot: CardPhotoSlot,
    ) => Promise<IQueuedCardPhoto | undefined>;
    send: (queued: IQueuedCardPhoto) => Promise<void>;
    discard: (queued: IQueuedCardPhoto) => Promise<void>;
  };
}

export function useDigitalCardFormSubmit({
  cardId,
  isEdit,
  draftKey,
  onSaved,
  photoActions,
}: IUseDigitalCardFormSubmitProps) {
  const t = useTranslations("digitalCards.form");
  const saveMutation = digitalCardService.useSaveDigitalCard();

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: DigitalCardRequest, photos: CardPhotoChanges) {
    closeModalUrl();

    // Cleared now so a pending save cannot prefill the next new card; the catch puts it back.
    const draft = getFormDraft(draftKey);
    removeFormDraft(draftKey);

    const offline = !onlineManager.isOnline();
    if (offline) {
      toast.info(t("savedOffline"));
    }

    const uploads = CARD_PHOTO_SLOTS.flatMap((slot) => {
      const file = photos[slot];
      return file ? [{ slot, file }] : [];
    });
    const removals = CARD_PHOTO_SLOTS.filter((slot) => photos[slot] === null);

    // Queued before the save answers, so photos picked on a weak signal survive the app closing meanwhile.
    const queueing = Promise.all([
      ...uploads.map(({ slot, file }) => photoActions.queueUpload(slot, file)),
      ...removals.map((slot) => photoActions.queueRemoval(slot)),
    ]).then((queued) => queued.filter((entry) => entry !== undefined));

    let sending: Promise<unknown> | undefined;
    function sendQueuedPhotos() {
      sending ??= queueing.then((queued) =>
        Promise.all(queued.map((entry) => photoActions.send(entry))),
      );
      return sending;
    }

    try {
      const saving = saveMutation.mutateAsync({
        id: cardId,
        data: toCardRequest(data),
      });

      // A paused save may outlive the tab; the outbox sends these after it, so here they only show as queued.
      if (offline) void sendQueuedPhotos();

      await saving;
    } catch (error) {
      if (draft) setFormDraft(draftKey, draft.values, draft.savedAt);

      // This submit's photos must not follow a card that was refused; the reopened form gets them back.
      const queued = await queueing;
      await Promise.all(queued.map((entry) => photoActions.discard(entry)));

      // The limit dialog explains it; the draft stays for when there is room again.
      if (isLimitReached(error)) return;

      stashModalError(draftKey, error);
      stashPendingCard(draftKey, {
        id: cardId,
        codeValue: data.codeValue,
        barcodeValue: data.barcodeValue ?? null,
        photos,
      });
      openModalUrl(
        isEdit
          ? { name: "digital-card", action: "edit", id: cardId }
          : { name: "digital-card", action: "new" },
      );
      return;
    }

    toast.success(t("saved"));
    onSaved();

    // The card exists server-side only now, so photos can follow; failures report and stay queued themselves.
    await sendQueuedPhotos();
  }

  return { onSubmit, isLoading: saveMutation.isPending };
}
