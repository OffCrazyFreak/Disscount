import { onlineManager } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CardPhotoChanges } from "@/app/(user)/digital-cards/components/forms/digital-card-form-types";
import { toCardRequest } from "@/app/(user)/digital-cards/utils/digital-card-form-values";
import { stashPendingCard } from "@/app/(user)/digital-cards/utils/pending-card-stash";
import { CARD_PHOTO_SLOTS, type CardPhotoSlot } from "@/constants/card-codes";
import { digitalCardService } from "@/lib/api";
import type { DigitalCardRequest } from "@/lib/api/types";
import { stashModalError } from "@/lib/modal/modal-error-bus";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { removeFormDraft } from "@/utils/browser/local-storage";

interface IUseDigitalCardFormSubmitProps {
  cardId: string;
  isEdit: boolean;
  draftKey: string;
  // The modal lingers briefly after closing, so a quick reopen would reuse a saved card's id.
  onSaved: () => void;
  photoActions: {
    upload: (slot: CardPhotoSlot, file: File) => Promise<void>;
    remove: (slot: CardPhotoSlot) => Promise<void>;
  };
}

export function useDigitalCardFormSubmit({
  cardId,
  isEdit,
  draftKey,
  onSaved,
  photoActions,
}: IUseDigitalCardFormSubmitProps) {
  const saveMutation = digitalCardService.useSaveDigitalCard();

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: DigitalCardRequest, photos: CardPhotoChanges) {
    closeModalUrl();

    const offline = !onlineManager.isOnline();
    if (offline) {
      toast.info(
        "Izvan si mreže - promjena će se sinkronizirati kad se vratiš na mrežu.",
      );
    }

    const uploads = CARD_PHOTO_SLOTS.flatMap((slot) => {
      const file = photos[slot];
      return file ? [{ slot, file }] : [];
    });
    const removals = CARD_PHOTO_SLOTS.filter((slot) => photos[slot] === null);

    let uploading: Promise<unknown> | undefined;
    function startUploads() {
      uploading ??= Promise.all(
        uploads.map(({ slot, file }) => photoActions.upload(slot, file)),
      );
      return uploading;
    }

    try {
      const saving = saveMutation.mutateAsync({
        id: cardId,
        data: toCardRequest(data),
      });

      // A paused save waits for the network, and the tab may be gone by then. Uploads made
      // offline land in the outbox, which survives a reload.
      if (offline) void startUploads();

      await saving;
    } catch (error) {
      stashModalError(draftKey, error);
      stashPendingCard(draftKey, {
        id: cardId,
        codeValue: data.codeValue,
        barcodeValue: data.barcodeValue ?? null,
      });
      openModalUrl(
        isEdit
          ? { name: "digital-card", action: "edit", id: cardId }
          : { name: "digital-card", action: "new" },
      );
      return;
    }

    toast.success("Kartica je spremljena.");
    removeFormDraft(draftKey);
    onSaved();

    // The card exists server-side only now, so photos can follow.
    try {
      await Promise.all([
        startUploads(),
        ...removals.map((slot) => photoActions.remove(slot)),
      ]);
    } catch {
      toast.error(
        "Neke slike nisu spremljene. Otvori karticu i pokušaj ponovno.",
      );
    }
  }

  return { onSubmit, isLoading: saveMutation.isPending };
}
