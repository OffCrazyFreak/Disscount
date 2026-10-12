import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CARD_PHOTO_SLOTS, type CardPhotoSlot } from "@/constants/card-codes";
import { setCardPhotoInCache } from "@/lib/api/digital-cards/photo-cache";
import {
  deleteCardPhoto,
  uploadCardPhoto,
} from "@/lib/api/digital-cards/photo-queries";
import { parseProblem, problemMessage } from "@/lib/api/problem-details";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import {
  dequeueCardPhoto,
  enqueueCardPhoto,
  enqueueCardPhotoRemoval,
  hasQueuedCardPhoto,
} from "@/lib/offline/card-photo-outbox";
import { deleteSlotForCard } from "@/lib/offline/card-photo-store";
import { failureAction } from "@/lib/offline/failure-policy";
import { photoSlotKey, runExclusive } from "@/lib/offline/slot-lock";
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

    async function queue() {
      await enqueueCardPhoto(cardId, slot, prepared.full, prepared.thumb);
      mark(slot, "queued");
    }

    // Serialized with the outbox replay, whose in-flight send of this slot would otherwise
    // finish after this choice and restore the older photo.
    return runExclusive(photoSlotKey(cardId, slot), async () => {
      if (!navigator.onLine) return queue();

      try {
        const photo = await uploadCardPhoto(
          cardId,
          slot,
          prepared.full,
          prepared.thumb,
        );
        await dequeueCardPhoto(cardId, slot);
        setCardPhotoInCache(queryClient, cardId, slot, photo);
        mark(slot, undefined);
      } catch (error) {
        // Offline, signed out, throttled or a server fault will pass, and a 404 means the
        // card's own save has not reached the server yet: the outbox replays after paused
        // saves resume.
        if (
          failureAction(error) === "keep" ||
          parseProblem(error)?.status === 404
        ) {
          return queue();
        }

        mark(slot, "error");
        toast.error(
          problemMessage(error, "Slika nije spremljena. Pokušaj ponovno."),
        );
      }
    });
  }

  function remove(slot: CardPhotoSlot): Promise<void> {
    return runExclusive(photoSlotKey(cardId, slot), () => removeNow(slot));
  }

  async function removeNow(slot: CardPhotoSlot): Promise<void> {
    try {
      await dequeueCardPhoto(cardId, slot);

      if (!navigator.onLine) {
        await enqueueCardPhotoRemoval(cardId, slot);
      } else {
        try {
          await deleteCardPhoto(cardId, slot);
        } catch (error) {
          if (failureAction(error) === "keep") {
            await enqueueCardPhotoRemoval(cardId, slot);
          } else if (parseProblem(error)?.status !== 404) {
            throw error;
          }
        }
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
