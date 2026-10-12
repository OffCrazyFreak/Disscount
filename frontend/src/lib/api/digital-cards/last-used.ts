import type { QueryClient } from "@tanstack/react-query";
import { createStore, delMany, getMany, keys, set } from "idb-keyval";

import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import {
  updateCard,
  zonelessNow,
} from "@/lib/api/digital-cards/optimistic-cards";
import { postCardsUsed } from "@/lib/api/digital-cards/queries";
import type { DigitalCardDto } from "@/lib/api/types";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { deleteIf } from "@/lib/offline/idb-transactions";
import { whenPurgesSettled } from "@/lib/offline/purge-gate";

/**
 * Last-used tracking is a local queue, not a paused mutation: opening a card must never
 * wait on the network, and a lost write only costs a sort position. The app's QueryClient
 * is bound once from the React Query provider (bindLastUsedQueryClient), so callers just
 * use recordCardUsed(id) from any event handler.
 */
const FLUSH_INTERVAL_MS = 60_000;
const MAX_BATCH = 50;

interface IQueuedUse {
  id: string;
  usedAt: string;
}

let store: ReturnType<typeof createStore> | undefined;
let boundClient: QueryClient | undefined;
let lastFlushAt = 0;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let flushing = false;

function queueStore() {
  store ??= createStore("disscount-card-used", "queue");
  return store;
}

/** Part of logout: a queued use is a record of which cards the account opened. */
export async function deleteUsedQueueForIdentity(identity: string) {
  const prefix = `${identity}:`;
  const stale = (await keys<string>(queueStore())).filter((key) =>
    String(key).startsWith(prefix),
  );
  await delMany(stale, queueStore());
}

async function flush(keepalive = false) {
  if (flushing) return;
  flushing = true;
  lastFlushAt = Date.now();

  // Captured once: a flush belongs to the account that queued the uses, even if the
  // identity switches while a request is in flight.
  const identity = getCacheIdentity();

  try {
    const prefix = `${identity}:`;
    const queuedKeys = (await keys<string>(queueStore())).filter((key) =>
      String(key).startsWith(prefix),
    );
    const values = await getMany<IQueuedUse>(queuedKeys, queueStore());
    const queued = queuedKeys.flatMap((key, i) =>
      values[i] ? [{ key, use: values[i] }] : [],
    );

    for (let i = 0; i < queued.length; i += MAX_BATCH) {
      if (getCacheIdentity() !== identity) return;

      const batch = queued.slice(i, i + MAX_BATCH);
      await postCardsUsed(
        batch.map(({ use }) => use),
        { keepalive },
      );

      // A card opened again while the request was in flight has a newer usedAt and
      // stays queued for the next flush.
      await Promise.all(
        batch.map(({ key, use }) =>
          deleteIf<IQueuedUse>(
            key,
            queueStore(),
            (current) => current?.usedAt === use.usedAt,
          ),
        ),
      );
    }
  } catch {
    // Kept in the queue; the next flush sends it.
  } finally {
    flushing = false;
  }
}

function scheduleFlush() {
  if (flushTimer) return;

  const wait = Math.max(0, lastFlushAt + FLUSH_INTERVAL_MS - Date.now());
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    void flush();
  }, wait);
}

export function bindLastUsedQueryClient(queryClient: QueryClient) {
  if (boundClient || typeof document === "undefined") return;
  boundClient = queryClient;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush(true);
  });
  void flush();
}

export function recordCardUsed(id: string): void {
  if (typeof indexedDB === "undefined") return;

  const usedAt = zonelessNow();

  boundClient?.setQueryData<DigitalCardDto[] | undefined>(
    DIGITAL_CARD_QUERY_KEYS.me,
    (old) => old && updateCard(old, id, { lastUsedAt: usedAt }),
  );

  // The backend reads usedAt as an Instant, so the queue keeps the offset-bearing form.
  const entry: IQueuedUse = { id, usedAt: new Date().toISOString() };
  const key = `${getCacheIdentity()}:${id}`;

  void whenPurgesSettled()
    .then(() => set(key, entry, queueStore()))
    .then(scheduleFlush)
    .catch(() => undefined);
}
