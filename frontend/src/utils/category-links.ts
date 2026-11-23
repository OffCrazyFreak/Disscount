import { localizedUrl } from "@/i18n/alternates";
import type { AppLocale } from "@/i18n/locales";

export const CATEGORIES_PATH = "/categories";

/** Page 1 has no query, so `?page=1` and the bare URL never compete as two canonicals. */
export function categoryPath(slug: string, page = 1): string {
  const path = `${CATEGORIES_PATH}/${encodeURIComponent(slug)}`;

  return page > 1 ? `${path}?page=${page}` : path;
}

export function categoryPageUrl(
  slug: string,
  locale: AppLocale,
  page = 1,
): string {
  return localizedUrl(categoryPath(slug, page), locale);
}
