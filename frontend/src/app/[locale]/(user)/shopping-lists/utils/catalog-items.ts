import type { ShoppingListItemDto } from "@/lib/api/schemas/shopping-list-item";

/** A list item linked to a catalog product, so it has prices and a product page. */
export type CatalogItem = ShoppingListItemDto & { ean: string };

export function isCatalogItem(item: ShoppingListItemDto): item is CatalogItem {
  return Boolean(item.ean);
}

export function catalogEans(
  items: ShoppingListItemDto[] | undefined,
): string[] {
  return [
    ...new Set((items ?? []).filter(isCatalogItem).map((item) => item.ean)),
  ];
}

/** What a store comparison covers: products still to buy. Plain items have no prices. */
export function itemsToCompare(
  items: ShoppingListItemDto[] | undefined,
): CatalogItem[] {
  return (items ?? []).filter(
    (item): item is CatalogItem => !item.isChecked && isCatalogItem(item),
  );
}
