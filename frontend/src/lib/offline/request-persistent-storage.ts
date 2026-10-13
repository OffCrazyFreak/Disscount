const REQUESTED_FLAG = "disscount-persist-storage-requested";

/**
 * Asks the browser not to evict cached cards and photos under storage pressure. Asked once,
 * after the first saved card, because a prompt before the user has anything to lose is noise.
 */
export function requestPersistentStorage() {
  if (typeof window === "undefined" || !navigator.storage?.persist) return;

  try {
    if (window.localStorage.getItem(REQUESTED_FLAG)) return;
    window.localStorage.setItem(REQUESTED_FLAG, "1");
  } catch {
    return;
  }

  void navigator.storage.persist().catch(() => undefined);
}
