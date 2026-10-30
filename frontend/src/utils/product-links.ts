import { appUrl } from "@/lib/env";
import { localePath } from "@/i18n/locale-path";
import type { AppLocale } from "@/i18n/locales";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { formatQuantity } from "@/utils/strings";

/** The price API carries no imagery, so the web is the only source of a picture */
export function productImageSearchUrl(product: ProductResponse): string {
  const terms = [product.name, product.brand, formatQuantity(product.quantity)];
  const query = terms.filter(Boolean).join(" ");

  return `https://www.google.com/search?udm=2&q=${encodeURIComponent(query)}`;
}

/**
 * The one place the product route is spelled. Three call sites used to forget the
 * encoding, so an EAN with a stray character built a different URL depending on
 * where you clicked from.
 */
export function productPath(ean: string): string {
  return `/products/${encodeURIComponent(ean)}`;
}

// Shared links keep the sender's language: the URL alone decides what a page shows.
export function productPageUrl(ean: string, locale: AppLocale): string {
  return `${appUrl()}${localePath(locale, productPath(ean))}`;
}
