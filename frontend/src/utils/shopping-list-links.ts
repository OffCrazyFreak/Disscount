import { appUrl } from "@/lib/env";

/**
 * The one place the shopping-list route is spelled. It used to be hand-written
 * at each call site, and they disagreed: the card built the path unencoded while
 * the share action encoded it, so the same list produced two different URLs.
 */
export function shoppingListPath(id: string): string {
  return `/shopping-lists/${encodeURIComponent(id)}`;
}

export function shoppingListPageUrl(id: string): string {
  return `${appUrl()}${shoppingListPath(id)}`;
}
