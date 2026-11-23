import type { getTranslations } from "next-intl/server";

import type categories from "@/i18n/messages/hr/categories.json";

type CategoriesTranslator = Awaited<
  ReturnType<typeof getTranslations<"categories">>
>;

type NameKey =
  | `names.${keyof typeof categories.names}`
  | `departments.${keyof typeof categories.departments}`;

// The cast is checked at runtime by t.has, since slugs come from the backend.
function translatedOrSlug(
  t: CategoriesTranslator,
  key: string,
  slug: string,
): string {
  return t.has(key as NameKey) ? t(key as NameKey) : slug;
}

/** A category the backend adds before its translations ship shows its slug rather than failing the page. */
export function categoryName(t: CategoriesTranslator, slug: string): string {
  return translatedOrSlug(t, `names.${slug}`, slug);
}

export function departmentName(t: CategoriesTranslator, slug: string): string {
  return translatedOrSlug(t, `departments.${slug}`, slug);
}
