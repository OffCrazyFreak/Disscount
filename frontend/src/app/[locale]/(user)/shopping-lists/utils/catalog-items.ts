import type { ShoppingListItemDto } from "@/lib/api/schemas/shopping-list-item";

/** A list item linked to a catalog product, so it has prices and a product page. */
export type CatalogItem = ShoppingListItemDto & { ean: string };

export function isCatalogItem(item: ShoppingListItemDto): item is CatalogItem {
  return Boolean(item.ean);
}

/** Unique EANs of the catalog items, the only ones there is price data for. */
export function catalogEans(
  items: ShoppingListItemDto[] | undefined,
): string[] {
  return [
    ...new Set((items ?? []).filter(isCatalogItem).map((item) => item.ean)),
  ];
}
