import type { QueryClient } from "@tanstack/react-query";
import { createStore, del, delMany, entries, set } from "idb-keyval";
import { toast } from "sonner";

import type { CardPhotoSlot } from "@/constants/card-codes";
import { setCardPhotoInCache } from "@/lib/api/digital-cards/photo-cache";
import { uploadCardPhoto } from "@/lib/api/digital-cards/photo-queries";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { parseProblem } from "@/lib/api/problem-details";

interface IBytes {
  buf: ArrayBuffer;
  type: string;
}

interface IOutboxEntry {
  identity: string;
  cardId: string;
  slot: CardPhotoSlot;
  full: IBytes;
  thumb?: IBytes;
}

let store: ReturnType<typeof createStore> | undefined;

function outboxStore() {
  store ??= createStore("disscount-card-photo-outbox", "uploads");
  return store;
}

const entryKey = (identity: string, cardId: string, slot: CardPhotoSlot) =>
  `${identity}:${cardId}:${slot}`;

async function toBytes(blob: Blob): Promise<IBytes> {
  return { buf: await blob.arrayBuffer(), type: blob.type };
}

const toBlob = ({ buf, type }: IBytes) => new Blob([buf], { type });

/** One entry per slot, so a newer photo replaces one still waiting to be sent. */
export async function enqueueCardPhoto(
  cardId: string,
  slot: CardPhotoSlot,
  full: Blob,
  thumb?: Blob,
) {
  const identity = getCacheIdentity();
  const entry: IOutboxEntry = {
    identity,
    cardId,
    slot,
    full: await toBytes(full),
    thumb: thumb ? await toBytes(thumb) : undefined,
  };
  await set(entryKey(identity, cardId, slot), entry, outboxStore());
}

export async function dequeueCardPhoto(cardId: string, slot: CardPhotoSlot) {
  await del(entryKey(getCacheIdentity(), cardId, slot), outboxStore());
}

export async function hasQueuedCardPhoto(cardId: string, slot: CardPhotoSlot) {
  const all = await entries<string, IOutboxEntry>(outboxStore());
  const key = entryKey(getCacheIdentity(), cardId, slot);
  return all.some(([k]) => k === key);
}

export async function deleteOutboxForIdentity(identity: string) {
  const all = await entries<string, IOutboxEntry>(outboxStore());
  await delMany(
    all.filter(([, e]) => e.identity === identity).map(([k]) => k),
    outboxStore(),
  );
}

let replaying = false;

/**
 * Sends queued photos for the current account. Stops at the first network failure and
 * keeps what is left; any other rejection (card deleted, photo refused) drops that entry,
 * since resending it can never succeed. Call after paused card saves have resumed, or an
 * upload for a card the server has not seen yet answers 404.
 */
export async function replayCardPhotoOutbox(queryClient: QueryClient) {
  if (replaying || typeof indexedDB === "undefined") return;
  replaying = true;

  try {
    const identity = getCacheIdentity();
    const all = await entries<string, IOutboxEntry>(outboxStore());

    for (const [key, entry] of all) {
      if (entry.identity !== identity) continue;

      try {
        const photo = await uploadCardPhoto(
          entry.cardId,
          entry.slot,
          toBlob(entry.full),
          entry.thumb ? toBlob(entry.thumb) : undefined,
        );
        setCardPhotoInCache(queryClient, entry.cardId, entry.slot, photo);
        await del(key, outboxStore());
      } catch (error) {
        if (isNetworkFailure(error)) break;

        await del(key, outboxStore());
        if (parseProblem(error)?.status !== 404) {
          toast.error("Slika kartice nije poslana.");
        }
      }
    }
  } finally {
    replaying = false;
  }
}
