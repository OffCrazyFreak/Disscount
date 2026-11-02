import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";
import type { IWatchlistPriceSnapshot } from "@/typings/local-storage";

// useSyncExternalStore needs the same object back until something changes, and
// localStorage parses into a new one on every read, so reads go through this cache.
const cachedSnapshots = new Map<string, IWatchlistPriceSnapshot | null>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

// Another tab's visit resets the baseline; without this, a stale cache here would write
// the old prices back over it.
function onStorage(event: StorageEvent) {
  if (event.storageArea !== localStorage) return;

  cachedSnapshots.clear();
  notify();
}

export function subscribeToWatchlistPriceSnapshots(onChange: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Straight from localStorage, for a write that must merge with what other tabs saved. */
export function readStoredWatchlistPriceSnapshot(
  userId: string,
): IWatchlistPriceSnapshot | null {
  return getAppStorage().watchlistPriceSnapshots?.[userId] ?? null;
}

/** The best price per watched EAN as this account last saw it on this device. */
export function getWatchlistPriceSnapshot(
  userId: string | undefined,
): IWatchlistPriceSnapshot | null {
  if (!userId) return null;

  if (!cachedSnapshots.has(userId)) {
    cachedSnapshots.set(
      userId,
      getAppStorage().watchlistPriceSnapshots?.[userId] ?? null,
    );
  }

  return cachedSnapshots.get(userId) ?? null;
}

export function setWatchlistPriceSnapshot(
  userId: string,
  snapshot: IWatchlistPriceSnapshot | null,
) {
  const { [userId]: _previous, ...others } =
    getAppStorage().watchlistPriceSnapshots ?? {};

  cachedSnapshots.set(userId, snapshot);
  setAppStorage({
    watchlistPriceSnapshots: snapshot
      ? { ...others, [userId]: snapshot }
      : others,
  });
  notify();
}
