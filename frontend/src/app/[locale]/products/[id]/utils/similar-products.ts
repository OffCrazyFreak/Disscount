import type { CategoryProduct } from "@/lib/api/types";

export const SIMILAR_PRODUCT_LIMIT = 8;

type NamedCategoryProduct = CategoryProduct & { name: string };

/** A nameless product would leave a link with no descriptive text, so it is skipped. */
export function similarProducts(
  categoryProducts: CategoryProduct[],
  currentEan: string,
): NamedCategoryProduct[] {
  return categoryProducts
    .filter(
      (item): item is NamedCategoryProduct =>
        item.ean !== currentEan && Boolean(item.name),
    )
    .slice(0, SIMILAR_PRODUCT_LIMIT);
}
