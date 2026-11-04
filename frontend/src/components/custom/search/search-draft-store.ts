import { useSyncExternalStore } from "react";

export interface ISearchDraftStore {
  subscribe: (listener: () => void) => () => void;
  /** What was typed since the URL last changed, null when there is nothing */
  getTyped: () => string | null;
  type: (text: string) => void;
  clear: () => void;
  /** Reports the URL's `q`. Every field on a store does, and only a change counts */
  followRoute: (routeQuery: string) => void;
}

/** The text in progress in a search field or a group of them, apart from the URL's `q`. */
export function createSearchDraftStore(): ISearchDraftStore {
  const listeners = new Set<() => void>();
  let typed: string | null = null;
  let lastRouteQuery = "";
  let isClearOnItsWay = false;

  function setTyped(next: string | null) {
    typed = next;
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getTyped: () => typed,
    type: setTyped,
    clear() {
      isClearOnItsWay = Boolean(lastRouteQuery);
      setTyped("");
    },
    followRoute(routeQuery) {
      if (routeQuery === lastRouteQuery) return;

      const isEchoOfClear = isClearOnItsWay && !routeQuery;
      lastRouteQuery = routeQuery;
      isClearOnItsWay = false;

      // The URL follows a clear in a transition: echoing it would wipe what was typed since.
      if (!isEchoOfClear) setTyped(null);
    },
  };
}

// Only effects and event handlers write to it, so the server's copy stays empty across requests.
export const productSearchDraft = createSearchDraftStore();

export function useSearchDraftValue(
  store: ISearchDraftStore,
  routeQuery: string,
): string {
  const typed = useSyncExternalStore(
    store.subscribe,
    store.getTyped,
    () => null,
  );

  return typed ?? routeQuery;
}
