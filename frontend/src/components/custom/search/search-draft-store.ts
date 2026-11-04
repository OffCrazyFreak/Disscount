import { useSyncExternalStore } from "react";

export interface ISearchDraftStore {
  subscribe: (listener: () => void) => () => void;
  /** What was typed since the URL last changed, null when there is nothing */
  getTyped: () => string | null;
  type: (text: string) => void;
  clear: () => void;
  /** A field is sending the URL to this query, so its landing must not overwrite newer text */
  navigatingTo: (query: string) => void;
  /** Reports the URL's `q`. Every field on a store does, and only a change counts */
  followRoute: (routeQuery: string) => void;
}

/** The text in progress in a search field or a group of them, apart from the URL's `q`. */
export function createSearchDraftStore(): ISearchDraftStore {
  const listeners = new Set<() => void>();
  let typed: string | null = null;
  let lastRouteQuery = "";
  // Queries the fields sent the URL to that have not landed yet, oldest first.
  let inFlight: string[] = [];

  function setTyped(next: string | null) {
    typed = next;
    listeners.forEach((listener) => listener());
  }

  function navigatingTo(query: string) {
    if (query !== lastRouteQuery && inFlight.at(-1) !== query) {
      inFlight.push(query);
    }

    setTyped(query);
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getTyped: () => typed,
    type: setTyped,
    clear: () => navigatingTo(""),
    navigatingTo,
    followRoute(routeQuery) {
      if (routeQuery === lastRouteQuery) return;

      lastRouteQuery = routeQuery;
      const landed = inFlight.indexOf(routeQuery);

      // Nothing the fields sent: Back, a link. The URL wins over whatever was typed.
      if (landed === -1) {
        inFlight = [];
        setTyped(null);
        return;
      }

      // Navigations land in a transition, so the text may have moved on since this one left.
      inFlight = inFlight.slice(landed + 1);
      if (typed === routeQuery) setTyped(null);
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
