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
  return replaceIf(key, customStore, matches, undefined);
}

/** Puts `replacement` back, or deletes when there is none, only while the stored value still matches. */
export function replaceIf<T>(
  key: IDBValidKey,
  customStore: UseStore,
  matches: (value: T | undefined) => boolean,
  replacement: T | undefined,
): Promise<void> {
  return customStore("readwrite", (store) => {
    const done = settle(store);
    const request = store.get(key);
    request.onsuccess = () => {
      if (!matches(request.result as T | undefined)) return;

      if (replacement === undefined) store.delete(key);
      else store.put(replacement, key);
    };
    return done;
  });
}

/** Writes `value` and hands back what it replaced, in one transaction so nothing lands between the two. */
export function swap<T>(
  key: IDBValidKey,
  customStore: UseStore,
  value: T,
): Promise<T | undefined> {
  return customStore("readwrite", async (store) => {
    const done = settle(store);
    const request = store.get(key);
    let previous: T | undefined;
    request.onsuccess = () => {
      previous = request.result as T | undefined;
      store.put(value, key);
    };
    await done;
    return previous;
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
