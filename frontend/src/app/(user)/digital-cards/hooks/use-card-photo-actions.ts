import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CARD_PHOTO_SLOTS, type CardPhotoSlot } from "@/constants/card-codes";
import { setCardPhotoInCache } from "@/lib/api/digital-cards/photo-cache";
import { problemMessage } from "@/lib/api/problem-details";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import {
  enqueueCardPhoto,
  enqueueCardPhotoRemoval,
  hasQueuedCardPhoto,
  sendQueuedCardPhoto,
} from "@/lib/offline/card-photo-outbox";
import { deleteSlotForCard } from "@/lib/offline/card-photo-store";
import {
  prepareCardImage,
  type IPreparedCardImage,
} from "@/utils/browser/card-image";

type PhotoStatus = "uploading" | "queued" | "error";
type StatusMap = Partial<Record<CardPhotoSlot, PhotoStatus>>;

export function useCardPhotoActions(cardId: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusMap>({});

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      CARD_PHOTO_SLOTS.map(async (slot) =>
        (await hasQueuedCardPhoto(cardId, slot)) ? slot : null,
      ),
    ).then((queued) => {
      if (cancelled) return;
      setStatus((old) => {
        const next = { ...old };
        for (const slot of queued) if (slot) next[slot] ??= "queued";
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [cardId]);

  function mark(slot: CardPhotoSlot, value: PhotoStatus | undefined) {
    setStatus((old) => ({ ...old, [slot]: value }));
  }

  async function upload(slot: CardPhotoSlot, file: File): Promise<void> {
    mark(slot, "uploading");

    let prepared: IPreparedCardImage;
    try {
      prepared = await prepareCardImage(file, slot);
    } catch (error) {
      mark(slot, "error");
      toast.error(
        error instanceof Error ? error.message : "Slika nije obrađena.",
      );
      return;
    }

    try {
      await enqueueCardPhoto(cardId, slot, prepared.full, prepared.thumb);
    } catch {
      mark(slot, "error");
      toast.error("Slika nije spremljena. Pokušaj ponovno.");
      return;
    }

    if (!navigator.onLine) {
      mark(slot, "queued");
      return;
    }

    // A 404 means the card's own save has not reached the server yet; the outbox
    // replays after paused saves resume.
    const { outcome, error } = await sendQueuedCardPhoto(
      queryClient,
      cardId,
      slot,
      true,
    );

    if (outcome === "sent") mark(slot, undefined);
    else if (outcome === "kept") mark(slot, "queued");
    else {
      mark(slot, "error");
      toast.error(
        problemMessage(error, "Slika nije spremljena. Pokušaj ponovno."),
      );
    }
  }

  async function remove(slot: CardPhotoSlot): Promise<void> {
    try {
      // Replaces a waiting upload for the slot, since the removal is the newer choice.
      const nonce = await enqueueCardPhotoRemoval(cardId, slot);

      if (navigator.onLine) {
        const result = await sendQueuedCardPhoto(queryClient, cardId, slot);

        // A newer choice queued while this waited was sent instead and owns the slot.
        if (result.nonce !== undefined && result.nonce !== nonce) return;
        if (result.outcome === "dropped") throw result.error;
      }
    } catch {
      toast.error("Slika nije obrisana. Pokušaj ponovno.");
      return;
    }

    setCardPhotoInCache(queryClient, cardId, slot, null);
    mark(slot, undefined);
    void deleteSlotForCard(getCacheIdentity(), cardId, slot).catch(
      () => undefined,
    );
  }

  return { upload, remove, status };
}

export default useCardPhotoActions;
