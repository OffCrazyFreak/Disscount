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

interface IPhotoUrl {
  key: string;
  url: string;
}

/** Object URL of the cached or freshly fetched photo; undefined while loading or unavailable. */
export function useCardPhoto(
  cardId: string,
  photo: CardPhotoDto | undefined,
  size: CardPhotoSize,
): string | undefined {
  const [loaded, setLoaded] = useState<IPhotoUrl>();
  const slot = photo?.slot;
  const sha256 = photo?.sha256;
  const key =
    slot && sha256 ? `${cardId}:${slot}:${size}:${sha256}` : undefined;

  useEffect(() => {
    if (!slot || !sha256 || !key) return;

    let cancelled = false;
    let objectUrl: string | undefined;

    loadPhoto(cardId, { slot, sha256 }, size)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ key, url: objectUrl });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cardId, slot, sha256, size, key]);

  // After the key changes the stored URL has been revoked; it must not be handed out.
  return loaded && loaded.key === key ? loaded.url : undefined;
}

export default useCardPhoto;
