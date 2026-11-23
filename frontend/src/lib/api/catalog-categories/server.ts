import "server-only";
import { cache } from "react";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import {
  catalogCategoriesSchema,
  categoryProductsPageSchema,
  type CatalogCategories,
  type CategoryProductsPage,
} from "@/lib/api/types";

/** The catalogue changes once a day at import, as the backend's own Cache-Control says. */
const CATALOG_REVALIDATE_SECONDS = 60 * 60;

// The counts bound hub pages, so after an import they must catch up with the listings soon.
const CATEGORY_COUNTS_REVALIDATE_SECONDS = 10 * 60;

const CATALOG_TIMEOUT_MS = 10_000;

export const CATEGORY_PAGE_SIZE = 24;

function catalogFetch(
  path: string,
  {
    revalidate = CATALOG_REVALIDATE_SECONDS,
    timeoutMs = CATALOG_TIMEOUT_MS,
  } = {},
): Promise<Response> {
  return fetch(`${BACKEND_ORIGIN}${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/** Throws on any failure, so the page answers 500, which crawlers retry, rather than an empty hub. */
export const getCatalogCategories = cache(
  async (): Promise<CatalogCategories> => {
    const response = await catalogFetch("/api/products/categories", {
      revalidate: CATEGORY_COUNTS_REVALIDATE_SECONDS,
    });

    if (!response.ok) {
      throw new Error(`Catalogue categories answered ${response.status}`);
    }

    return catalogCategoriesSchema.parse(await response.json());
  },
);

/** One-based page, as in the URL; null for a slug the backend does not know. */
export const getCategoryProducts = cache(
  async (slug: string, page: number): Promise<CategoryProductsPage | null> => {
    const query = new URLSearchParams({
      page: String(page - 1),
      size: String(CATEGORY_PAGE_SIZE),
    });
    const response = await catalogFetch(
      `/api/products/categories/${encodeURIComponent(slug)}/products?${query}`,
    );

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Category ${slug} answered ${response.status}`);
    }

    return categoryProductsPageSchema.parse(await response.json());
  },
);
