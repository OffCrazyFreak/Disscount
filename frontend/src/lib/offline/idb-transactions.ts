import type { UseStore } from "idb-keyval";

function settle(store: IDBObjectStore): Promise<void> {
  return new Promise((resolve, reject) => {
    store.transaction.oncomplete = () => resolve();
    store.transaction.onabort = store.transaction.onerror = () =>
      reject(store.transaction.error);
  });
}

/** In one transaction, because a plain get-then-del would delete a newer value written between the two. */
export function deleteIf<T>(
  key: IDBValidKey,
  customStore: UseStore,
  matches: (value: T | undefined) => boolean,
): Promise<void> {
  return customStore("readwrite", (store) => {
    const done = settle(store);
    const request = store.get(key);
    request.onsuccess = () => {
      if (matches(request.result as T | undefined)) store.delete(key);
    };
    return done;
  });
}

/** idb-keyval's update() writes `undefined` back for a missing key, which resurrects an entry deleted meanwhile. */
export function updateIfPresent<T>(
  key: IDBValidKey,
  customStore: UseStore,
  updater: (value: T) => T,
): Promise<void> {
  return customStore("readwrite", (store) => {
    const done = settle(store);
    const request = store.get(key);
    request.onsuccess = () => {
      if (request.result !== undefined) {
        store.put(updater(request.result as T), key);
      }
    };
    return done;
  });
}
