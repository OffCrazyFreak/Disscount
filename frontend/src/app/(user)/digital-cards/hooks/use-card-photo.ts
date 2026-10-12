import { useEffect, useState } from "react";

import {
  fetchCardPhotoBlob,
  type CardPhotoSize,
} from "@/lib/api/digital-cards/photo-queries";
import type { CardPhotoDto } from "@/lib/api/types";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import {
  photoKey,
  readPhoto,
  writePhoto,
} from "@/lib/offline/card-photo-store";

// Many tiles can ask for the same blob in one render pass; they share one request.
const inflight = new Map<string, Promise<Blob>>();

async function loadPhoto(
  cardId: string,
  photo: CardPhotoDto,
  size: CardPhotoSize,
): Promise<Blob> {
  const key = photoKey(
    getCacheIdentity(),
    cardId,
    photo.slot,
    size,
    photo.sha256,
  );

  const cached = await readPhoto(key);
  if (cached) return cached;

  let pending = inflight.get(key);
  if (!pending) {
    pending = fetchCardPhotoBlob(cardId, photo.slot, size, photo.sha256)
      .then(async (blob) => {
        await writePhoto(key, blob).catch(() => undefined);
        return blob;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}

/** Object URL of the cached or freshly fetched photo; undefined while loading or unavailable. */
export function useCardPhoto(
  cardId: string,
  photo: CardPhotoDto | undefined,
  size: CardPhotoSize,
): string | undefined {
  const [url, setUrl] = useState<string>();
  const slot = photo?.slot;
  const sha256 = photo?.sha256;

  useEffect(() => {
    if (!slot || !sha256) return;

    let cancelled = false;
    let objectUrl: string | undefined;

    loadPhoto(cardId, { slot, sha256 }, size)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cardId, slot, sha256, size]);

  return slot && sha256 ? url : undefined;
}

export default useCardPhoto;
