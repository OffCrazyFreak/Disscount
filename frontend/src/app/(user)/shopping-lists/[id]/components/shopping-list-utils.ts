import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";

/**
 * Comparator function for sorting shopping list items by availability and name.
 * Available items come first, then sorted alphabetically within each group.
 */
export function sortShoppingListItemsByAvailabilityAndName(
  a: ShoppingListItemDto,
  b: ShoppingListItemDto,
  productsData: ProductResponse[],
  chain: ChainProductResponse
): number {
  // Find product data for both items
  const productA = productsData.find((p) => p?.ean === a.ean);
  const productB = productsData.find((p) => p?.ean === b.ean);

  // Find chain data for both items
  const chainDataA = productA?.chains?.find(
    (c: ChainProductResponse) => c.chain === chain.chain
  );
  const chainDataB = productB?.chains?.find(
    (c: ChainProductResponse) => c.chain === chain.chain
  );

  // Check availability
  const isAvailableA = Boolean(chainDataA);
  const isAvailableB = Boolean(chainDataB);

  // Available items come first
  if (isAvailableA && !isAvailableB) return -1;
  if (!isAvailableA && isAvailableB) return 1;

  // Within each group, sort alphabetically
  return a.name.localeCompare(b.name, "hr", {
    sensitivity: "base",
  });
}
