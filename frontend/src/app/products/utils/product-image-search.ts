import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { formatQuantity } from "@/utils/strings";

/** Opens Google's image tab for a product, named as closely as we can describe it. */
export function openProductImageSearch(product: ProductResponse): void {
  const terms = [
    product.name,
    product.brand,
    product.quantity ? formatQuantity(product.quantity) : null,
  ].filter(Boolean);

  const query = encodeURIComponent(terms.join(" "));

  window.open(`https://www.google.com/search?udm=2&q=${query}`, "_blank");
}
