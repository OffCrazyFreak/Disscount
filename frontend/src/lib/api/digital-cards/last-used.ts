import type { QueryClient } from "@tanstack/react-query";
import { createStore, delMany, entries, set } from "idb-keyval";

import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import {
  updateCard,
  zonelessNow,
} from "@/lib/api/digital-cards/optimistic-cards";
import { postCardsUsed } from "@/lib/api/digital-cards/queries";
import type { DigitalCardDto } from "@/lib/api/types";
import { getCacheIdentity } from "@/lib/offline/cache-identity";

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

async function flush() {
  if (flushing) return;
  flushing = true;
  lastFlushAt = Date.now();

  try {
    const prefix = `${getCacheIdentity()}:`;
    const queued = (await entries<string, IQueuedUse>(queueStore())).filter(
      ([key]) => key.startsWith(prefix),
    );

    for (let i = 0; i < queued.length; i += MAX_BATCH) {
      const batch = queued.slice(i, i + MAX_BATCH);
      await postCardsUsed(batch.map(([, use]) => use));
      await delMany(
        batch.map(([key]) => key),
        queueStore(),
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
    if (document.visibilityState === "hidden") void flush();
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
  void set(`${getCacheIdentity()}:${id}`, entry, queueStore())
    .then(scheduleFlush)
    .catch(() => undefined);
}
