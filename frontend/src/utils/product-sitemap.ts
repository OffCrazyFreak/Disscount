import { appUrl } from "@/lib/env";

/** Fixed so robots.txt can name every file without the backend at build time; eight files hold 400,000 products under Google's per-file limit. */
export const PRODUCT_SITEMAP_IDS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Hashing keeps each EAN in the same file from one weekly import to the next. */
export function productSitemapId(ean: string): number {
  let hash = 0;

  for (const char of ean) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;
  }

  return hash % PRODUCT_SITEMAP_IDS.length;
}

export function productSitemapUrls(): string[] {
  return PRODUCT_SITEMAP_IDS.map(
    (id) => `${appUrl()}/products/sitemap/${id}.xml`,
  );
}
