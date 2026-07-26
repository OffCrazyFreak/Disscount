import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { formatQuantity } from "@/utils/strings";

/** The price API carries no product imagery, so the web is the only source */
export function productImageSearchUrl(product: ProductResponse): string {
  const terms = [product.name, product.brand, formatQuantity(product.quantity)];
  const query = terms.filter(Boolean).join(" ");

  return `https://www.google.com/search?udm=2&q=${encodeURIComponent(query)}`;
}

export function productPageUrl(ean: string): string {
  return `${window.location.origin}/products/${encodeURIComponent(ean)}`;
}
