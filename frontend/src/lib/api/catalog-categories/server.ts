import "server-only";
import { cache } from "react";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import { createExpiringKeySet } from "@/lib/expiring-key-set";
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

interface ICatalogFetchOptions {
  revalidate?: number;
  timeoutMs?: number;
  /** Next keys its fetch cache on headers but not on revalidate, so a second lifetime needs its own key. */
  cacheVariant?: string;
  /** Overrides timeoutMs, so several requests can share one deadline. */
  signal?: AbortSignal;
}

function catalogFetch(
  path: string,
  {
    revalidate = CATALOG_REVALIDATE_SECONDS,
    timeoutMs = CATALOG_TIMEOUT_MS,
    cacheVariant,
    signal = AbortSignal.timeout(timeoutMs),
  }: ICatalogFetchOptions = {},
): Promise<Response> {
  return fetch(`${BACKEND_ORIGIN}${path}`, {
    next: { revalidate },
    signal,
    ...(cacheVariant && { headers: { "X-Cache-Variant": cacheVariant } }),
  });
}

// Empty means no import has filled the catalogue yet, which the next import fixes within minutes, not the hour.
const EMPTY_CATALOG_REVALIDATE_SECONDS = 2 * 60;

/** Asks again under a short cache when the cached answer is empty, so hubs fill soon after the first import. */
async function catalogFetchUnlessEmpty<T>(
  path: string,
  options: ICatalogFetchOptions,
  read: (response: Response) => Promise<T>,
  isEmpty: (data: T) => boolean,
): Promise<T> {
  // One deadline for both requests, so a recheck never doubles the caller's time budget.
  const signal = AbortSignal.timeout(options.timeoutMs ?? CATALOG_TIMEOUT_MS);

  const data = await read(await catalogFetch(path, { ...options, signal }));
  if (!isEmpty(data)) return data;

  return read(
    await catalogFetch(path, {
      ...options,
      signal,
      revalidate: EMPTY_CATALOG_REVALIDATE_SECONDS,
      cacheVariant: "empty-recheck",
    }),
  );
}

/** Throws on any failure, so the page answers 500, which crawlers retry, rather than an empty hub. */
export const getCatalogCategories = cache(
  async (timeoutMs = CATALOG_TIMEOUT_MS): Promise<CatalogCategories> =>
    catalogFetchUnlessEmpty(
      "/api/products/categories",
      { revalidate: CATEGORY_COUNTS_REVALIDATE_SECONDS, timeoutMs },
      async (response) => {
        if (!response.ok) {
          throw new Error(`Catalogue categories answered ${response.status}`);
        }

        return catalogCategoriesSchema.parse(await response.json());
      },
      ({ categories }) =>
        categories.every((category) => category.productCount === 0),
    ),
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
    return catalogFetchUnlessEmpty(
      `/api/products/categories/${encodeURIComponent(slug)}/products?${query}`,
      { timeoutMs },
      async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) {
          throw new Error(`Category ${slug} answered ${response.status}`);
        }

        return categoryProductsPageSchema.parse(await response.json());
      },
      (listing) => listing?.page.totalItems === 0,
    );
  },
);

// Crawlers ask for many products we never classified, so a 404 is remembered instead of asked again.
const unclassifiedProducts = createExpiringKeySet(10 * 60 * 1000, 10_000);

/** Null when no category placed the product or the backend failed: a breadcrumb never fails a product page. */
export const getProductCategorySlug = cache(
  async (ean: string): Promise<string | null> => {
    if (unclassifiedProducts.has(ean)) return null;

    try {
      const response = await catalogFetch(
        `/api/products/${encodeURIComponent(ean)}/category`,
        { timeoutMs: OPTIONAL_LOOKUP_TIMEOUT_MS },
      );

      if (response.status === 404) {
        unclassifiedProducts.add(ean);
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
