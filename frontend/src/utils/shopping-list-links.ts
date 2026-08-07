import { appUrl } from "@/lib/env";

/**
 * The one place the shopping-list route is spelled. It used to be hand-written
 * at each call site, and they disagreed: the card built the path unencoded while
 * the share action encoded it, so the same list produced two different URLs.
 */
export function shoppingListPath(id: string): string {
  return `/shopping-lists/${encodeURIComponent(id)}`;
}

/**
 * The address to hand someone else, which is simply the list's own URL. There is no
 * separate share token: the id is the capability while the list is shared, and it grants
 * nothing once it is not, so the URL an owner sees in the address bar is the one worth
 * sending. Turning sharing off and on again therefore hands back the same URL.
 */
export function shareListUrl(id: string): string {
  return `${appUrl()}${shoppingListPath(id)}`;
}
