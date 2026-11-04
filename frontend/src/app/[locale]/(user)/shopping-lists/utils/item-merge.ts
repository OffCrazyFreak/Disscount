import type { ShoppingListItemDto } from "@/lib/api/schemas/shopping-list-item";

// Mirrors the backend's ShoppingListItemMatcher, so a toast can say whether an add bumped an existing row instead of creating one.
export function nameKey(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

export function mergesIntoExisting(
  items: ShoppingListItemDto[] | undefined,
  entry: { ean?: string | null; name: string },
): boolean {
  const key = nameKey(entry.name);

  return (items ?? []).some((item) => {
    if (entry.ean && item.ean === entry.ean) return true;
    if (entry.ean && item.ean) return false;
    return nameKey(item.name) === key;
  });
}
