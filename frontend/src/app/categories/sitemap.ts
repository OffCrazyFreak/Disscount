import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { isHubIndexable } from "@/app/[locale]/categories/utils/category-page";
import { localizedUrl } from "@/i18n/alternates";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { getCatalogCategories } from "@/lib/api/catalog-categories/server";
import { CATEGORIES_PATH, categoryPageUrl } from "@/utils/category-links";

/** Page 1 of the hubs the page lets be indexed; later pages are reached through pagination. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The backend is not reachable while the Docker image builds, so this renders per request.
  await connection();
  const { categories } = await getCatalogCategories();

  return [
    { url: localizedUrl(CATEGORIES_PATH, DEFAULT_LOCALE) },
    ...categories
      .filter((category) => isHubIndexable(DEFAULT_LOCALE, category))
      .map((category) => ({
        url: categoryPageUrl(category.slug, DEFAULT_LOCALE),
      })),
  ];
}
