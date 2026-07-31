import { appUrl } from "@/lib/env";

/**
 * The public address of a shared list. Deliberately built from the share token and not
 * the list id, so the list's own URL never travels in a forwarded link and revoking is a
 * matter of rotating the token rather than making the whole list private.
 */
export function shareListUrl(shareToken: string): string {
  return `${appUrl()}/s/${encodeURIComponent(shareToken)}`;
}
