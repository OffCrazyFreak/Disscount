import { appUrl } from "@/lib/env";
import { localePath } from "@/i18n/locale-path";
import type { AppLocale } from "@/i18n/locales";

/** The one place the route is spelled, because hand-written paths disagreed on encoding and gave one list two URLs. */
export function shoppingListPath(id: string): string {
  return `/shopping-lists/${encodeURIComponent(id)}`;
}

/** No separate share token: the id is the capability while shared, so re-sharing hands back the same URL. */
export function shareListUrl(id: string, locale: AppLocale): string {
  return `${appUrl()}${localePath(locale, shoppingListPath(id))}`;
}
