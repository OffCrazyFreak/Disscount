/**
 * Change notifications for a value kept in localStorage, shaped for useSyncExternalStore.
 * The storage event fires only in other tabs, so same-tab writes call notify themselves.
 */
export function createStorageSubscription() {
  const listeners = new Set<() => void>();

  function subscribe(onChange: () => void) {
    listeners.add(onChange);
    window.addEventListener("storage", onChange);

    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onChange);
    };
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  return { subscribe, notify };
}
