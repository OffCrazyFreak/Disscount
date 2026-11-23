import "server-only";
import { cache } from "react";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import {
  catalogCategoriesSchema,
  categoryProductsPageSchema,
  productCategorySchema,
  type CatalogCategories,
  type CategoryProductsPage,
} from "@/lib/api/types";

/** The catalogue changes once a day at import, as the backend's own Cache-Control says. */
const CATALOG_REVALIDATE_SECONDS = 60 * 60;

// The counts bound hub pages, so after an import they must catch up with the listings soon.
const CATEGORY_COUNTS_REVALIDATE_SECONDS = 10 * 60;

const CATALOG_TIMEOUT_MS = 10_000;

/** For lookups a page can do without, so a hung backend never holds the page. */
export const OPTIONAL_LOOKUP_TIMEOUT_MS = 2_500;

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
  async (timeoutMs = CATALOG_TIMEOUT_MS): Promise<CatalogCategories> => {
    const response = await catalogFetch("/api/products/categories", {
      revalidate: CATEGORY_COUNTS_REVALIDATE_SECONDS,
      timeoutMs,
    });

    if (!response.ok) {
      throw new Error(`Catalogue categories answered ${response.status}`);
    }

    return catalogCategoriesSchema.parse(await response.json());
  },
);

/** One-based page, as in the URL; null for a slug the backend does not know. */
export const getCategoryProducts = cache(
  async (
    slug: string,
    page: number,
    timeoutMs = CATALOG_TIMEOUT_MS,
  ): Promise<CategoryProductsPage | null> => {
    const query = new URLSearchParams({
      page: String(page - 1),
      size: String(CATEGORY_PAGE_SIZE),
    });
    const response = await catalogFetch(
      `/api/products/categories/${encodeURIComponent(slug)}/products?${query}`,
      { timeoutMs },
    );

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Category ${slug} answered ${response.status}`);
    }

    return categoryProductsPageSchema.parse(await response.json());
  },
);

// Crawlers ask for many products we never classified, so a 404 is remembered instead of asked again.
const UNCLASSIFIED_TTL_MS = 10 * 60 * 1000;
const UNCLASSIFIED_LIMIT = 10_000;

const unclassifiedUntil = new Map<string, number>();

function isKnownUnclassified(ean: string): boolean {
  const until = unclassifiedUntil.get(ean);

  if (until === undefined) return false;
  if (until > Date.now()) return true;

  unclassifiedUntil.delete(ean);
  return false;
}

function rememberUnclassified(ean: string) {
  unclassifiedUntil.delete(ean);
  unclassifiedUntil.set(ean, Date.now() + UNCLASSIFIED_TTL_MS);

  if (unclassifiedUntil.size > UNCLASSIFIED_LIMIT) {
    const oldest = unclassifiedUntil.keys().next().value;
    if (oldest !== undefined) unclassifiedUntil.delete(oldest);
  }
}

/** Null when no category placed the product or the backend failed: a breadcrumb never fails a product page. */
export const getProductCategorySlug = cache(
  async (ean: string): Promise<string | null> => {
    if (isKnownUnclassified(ean)) return null;

    try {
      const response = await catalogFetch(
        `/api/products/${encodeURIComponent(ean)}/category`,
        { timeoutMs: OPTIONAL_LOOKUP_TIMEOUT_MS },
      );

      if (response.status === 404) {
        rememberUnclassified(ean);
        return null;
      }

      if (!response.ok) {
        throw new Error(`Category of ${ean} answered ${response.status}`);
      }

      return productCategorySchema.parse(await response.json()).category;
    } catch (error) {
      console.warn("[catalog] product category lookup failed", error);

      return null;
    }
  },
);
