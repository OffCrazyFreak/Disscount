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
 * The public address of a shared list. Deliberately built from the share token and not
 * the list id, so the list's own URL never travels in a forwarded link and revoking is a
 * matter of rotating the token rather than making the whole list private.
 */
export function shareListUrl(shareToken: string): string {
  return `${appUrl()}/s/${encodeURIComponent(shareToken)}`;
}
