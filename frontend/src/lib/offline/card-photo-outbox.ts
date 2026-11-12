import type { QueryClient } from "@tanstack/react-query";
import { createStore, del, delMany, get, keys, set } from "idb-keyval";
import { toast } from "sonner";

import type { CardPhotoSlot } from "@/constants/card-codes";
import { setCardPhotoInCache } from "@/lib/api/digital-cards/photo-cache";
import {
  deleteCardPhoto,
  uploadCardPhoto,
} from "@/lib/api/digital-cards/photo-queries";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { failureAction, httpStatus } from "@/lib/offline/failure-policy";
import { deleteIf } from "@/lib/offline/idb-transactions";
import {
  canWriteAfterPurges,
  currentPurgeGeneration,
} from "@/lib/offline/purge-gate";
import { isQueuedWriteExpired } from "@/lib/offline/queued-write-expiry";
import { photoSlotKey, runExclusive } from "@/lib/offline/slot-lock";

interface IBytes {
  buf: ArrayBuffer;
  type: string;
}

interface IOutboxEntry {
  identity: string;
  cardId: string;
  slot: CardPhotoSlot;
  /** Absent on entries written before removals could be queued, which are uploads. */
  op?: "put" | "delete";
  /** Changes on every enqueue, so a finished send never deletes a newer entry. */
  nonce: string;
  /** Absent on entries queued before queued writes expired, which never expire. */
  queuedAt?: number;
  full?: IBytes;
  thumb?: IBytes;
}

let store: ReturnType<typeof createStore> | undefined;

function outboxStore() {
  store ??= createStore("disscount-card-photo-outbox", "uploads");
  return store;
}

function entryKey(identity: string, cardId: string, slot: CardPhotoSlot) {
  return `${identity}:${cardId}:${slot}`;
}

async function toBytes(blob: Blob): Promise<IBytes> {
  return { buf: await blob.arrayBuffer(), type: blob.type };
}

function toBlob({ buf, type }: IBytes) {
  return new Blob([buf], { type });
}

async function writeEntry(
  cardId: string,
  slot: CardPhotoSlot,
  build: (base: IOutboxEntry) => Promise<IOutboxEntry>,
) {
  // Captured before any await: the entry belongs to the account that asked for it.
  const identity = getCacheIdentity();
  const generation = currentPurgeGeneration();
  const entry = await build({
    identity,
    cardId,
    slot,
    nonce: crypto.randomUUID(),
    queuedAt: Date.now(),
  });

  if (!(await canWriteAfterPurges(generation))) return undefined;

  await set(entryKey(identity, cardId, slot), entry, outboxStore());
  return entry.nonce;
}

/** One entry per slot, so a newer photo replaces one still waiting to be sent. */
export function enqueueCardPhoto(
  cardId: string,
  slot: CardPhotoSlot,
  full: Blob,
  thumb?: Blob,
) {
  return writeEntry(cardId, slot, async (base) => ({
    ...base,
    op: "put",
    full: await toBytes(full),
    thumb: thumb ? await toBytes(thumb) : undefined,
  }));
}

/** Replaces a waiting upload for the slot too, since the removal is the newer intent. */
export function enqueueCardPhotoRemoval(cardId: string, slot: CardPhotoSlot) {
  return writeEntry(cardId, slot, async (base) => ({ ...base, op: "delete" }));
}

/** True when an upload (not a removal) is waiting for the slot. */
export async function hasQueuedCardPhoto(cardId: string, slot: CardPhotoSlot) {
  const entry = await get<IOutboxEntry>(
    entryKey(getCacheIdentity(), cardId, slot),
    outboxStore(),
  );
  return entry !== undefined && entry.op !== "delete";
}

export async function deleteOutboxForIdentity(identity: string) {
  const prefix = `${identity}:`;
  for (const key of lastHandled.keys()) {
    if (key.startsWith(prefix)) lastHandled.delete(key);
  }

  const stale = (await keys<string>(outboxStore())).filter((key) =>
    String(key).startsWith(prefix),
  );
  await delMany(stale, outboxStore());
}

let replaying = false;
let replayRequested = false;

async function send(entry: IOutboxEntry) {
  if (entry.op === "delete") {
    try {
      await deleteCardPhoto(entry.cardId, entry.slot);
    } catch (error) {
      // Already gone is the state the user asked for.
      if (httpStatus(error) !== 404) throw error;
    }
    return null;
  }

  return uploadCardPhoto(
    entry.cardId,
    entry.slot,
    toBlob(entry.full as IBytes),
    entry.thumb ? toBlob(entry.thumb) : undefined,
  );
}

// Only the keys the replay toasts use, so a caller can hand in a stable wrapper.
export type PhotoToastTranslator = (
  key: "offline.photoDeleteFailed" | "offline.photoSendFailed",
) => string;

async function replayOnce(queryClient: QueryClient, t: PhotoToastTranslator) {
  const identity = getCacheIdentity();
  const prefix = `${identity}:`;
  const queuedKeys = (await keys<string>(outboxStore())).filter((key) =>
    String(key).startsWith(prefix),
  );

  for (const key of queuedKeys) {
    // The account or listing may have changed, so re-read rather than send a dequeued entry.
    if (getCacheIdentity() !== identity) return;

    const peeked = await get<IOutboxEntry>(key, outboxStore());
    if (!peeked || peeked.identity !== identity) continue;

    const { outcome, error } = await sendQueuedCardPhoto(
      queryClient,
      peeked.cardId,
      peeked.slot,
    );
    if (outcome === "kept") return;

    if (outcome === "dropped" && httpStatus(error) !== 404) {
      toast.error(
        t(
          peeked.op === "delete"
            ? "offline.photoDeleteFailed"
            : "offline.photoSendFailed",
        ),
      );
    }
  }
}

// A later caller still learns an earlier send's result; dropped when unwaited, as errors hold blobs.
const lastHandled = new Map<string, ISendResult>();
const waiting = new Map<string, number>();

export interface ISendResult {
  outcome: "sent" | "kept" | "dropped";
  /** The queued choice this send handled, which may be newer than the caller's own. */
  nonce?: string;
  error?: unknown;
}

/** Outbox first so a reload loses nothing; serialized so an older send cannot land after a newer. */
export function sendQueuedCardPhoto(
  queryClient: QueryClient,
  cardId: string,
  slot: CardPhotoSlot,
  keepOn404 = false,
): Promise<ISendResult> {
  const key = entryKey(getCacheIdentity(), cardId, slot);
  waiting.set(key, (waiting.get(key) ?? 0) + 1);

  return runExclusive(photoSlotKey(cardId, slot), async () => {
    try {
      const result = await sendEntry(queryClient, key, keepOn404);

      if (result) lastHandled.set(key, result);
      return result ?? lastHandled.get(key) ?? { outcome: "sent" as const };
    } finally {
      const left = (waiting.get(key) ?? 1) - 1;
      if (left > 0) {
        waiting.set(key, left);
      } else {
        waiting.delete(key);
        lastHandled.delete(key);
      }
    }
  });
}

async function sendEntry(
  queryClient: QueryClient,
  key: string,
  keepOn404: boolean,
): Promise<ISendResult | null> {
  const identity = getCacheIdentity();
  const entry = await get<IOutboxEntry>(key, outboxStore());
  if (!entry || entry.identity !== identity) return null;

  const { nonce, cardId, slot } = entry;
  const finished = (current: IOutboxEntry | undefined) =>
    current?.nonce === nonce;

  if (entry.op !== "delete" && !entry.full) {
    await del(key, outboxStore());
    return { outcome: "sent", nonce };
  }

  if (entry.queuedAt !== undefined && isQueuedWriteExpired(entry.queuedAt)) {
    await deleteIf<IOutboxEntry>(key, outboxStore(), finished);
    return { outcome: "dropped", nonce, error: new Error("Queued too long") };
  }

  try {
    const photo = await send(entry);

    // A newer choice queued during the send replays next and owns the cache.
    const current = await get<IOutboxEntry>(key, outboxStore());
    if (getCacheIdentity() === identity && finished(current)) {
      setCardPhotoInCache(queryClient, cardId, slot, photo);
    }
    await deleteIf<IOutboxEntry>(key, outboxStore(), finished);
    return { outcome: "sent", nonce };
  } catch (error) {
    const notFound = httpStatus(error) === 404;
    if (failureAction(error) === "keep" || (keepOn404 && notFound)) {
      return { outcome: "kept", nonce, error };
    }

    await deleteIf<IOutboxEntry>(key, outboxStore(), finished);
    return { outcome: "dropped", nonce, error };
  }
}

/** Call after paused card saves resume, or an upload for an unseen card answers 404. */
export async function replayCardPhotoOutbox(
  queryClient: QueryClient,
  t: PhotoToastTranslator,
) {
  if (typeof indexedDB === "undefined") return;

  if (replaying) {
    replayRequested = true;
    return;
  }
  replaying = true;

  try {
    do {
      replayRequested = false;
      await replayOnce(queryClient, t);
    } while (replayRequested);
  } finally {
    replaying = false;
  }
}
