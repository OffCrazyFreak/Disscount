import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";
import type { WatchlistPriceSnapshot } from "@/typings/local-storage";

const EMPTY_SNAPSHOT: WatchlistPriceSnapshot = {};

// useSyncExternalStore needs the same object back until something changes, and
// localStorage parses into a new one on every read, so reads go through this cache.
const cachedSnapshots = new Map<string, WatchlistPriceSnapshot>();
const listeners = new Set<() => void>();

export function subscribeToWatchlistPriceSnapshots(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** The best price per watched EAN, in cents, as this account last saw it on this device. */
export function getWatchlistPriceSnapshot(
  userId: string | undefined,
): WatchlistPriceSnapshot {
  if (!userId) return EMPTY_SNAPSHOT;

  let snapshot = cachedSnapshots.get(userId);
  if (!snapshot) {
    snapshot =
      getAppStorage().watchlistPriceSnapshots?.[userId] ?? EMPTY_SNAPSHOT;
    cachedSnapshots.set(userId, snapshot);
  }

  return snapshot;
}

export function setWatchlistPriceSnapshot(
  userId: string,
  snapshot: WatchlistPriceSnapshot,
) {
  cachedSnapshots.set(userId, snapshot);
  setAppStorage({
    watchlistPriceSnapshots: {
      ...getAppStorage().watchlistPriceSnapshots,
      [userId]: snapshot,
    },
  });

  listeners.forEach((listener) => listener());
}
