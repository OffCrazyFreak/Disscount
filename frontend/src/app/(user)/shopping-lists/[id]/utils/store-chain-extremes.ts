import { ShoppingListItemDto } from "@/lib/api/types";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getChainAvgPriceRange,
  getPriceExtreme,
  type PriceExtreme,
} from "@/app/products/utils/product-utils";

/** Counts, per chain, how many list products sit at their extreme average price. */
function countChainsAtExtreme(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
  extreme: NonNullable<PriceExtreme>,
): Map<string, number> {
  const counts = new Map<string, number>();

  activeItems.forEach((item) => {
    const product = productsData.find(
      (candidate) => candidate?.ean === item.ean,
    );
    if (!product?.chains?.length) return;

    const range = getChainAvgPriceRange(product);
    if (!range) return;

    product.chains.forEach((chain) => {
      const extremeAtChain = getPriceExtreme(
        parseFloat(chain.avg_price),
        range.min,
        range.max,
      );
      if (extremeAtChain !== extreme) {
        return;
      }

      counts.set(chain.chain, (counts.get(chain.chain) ?? 0) + 1);
    });
  });

  return counts;
}

export function countCheapestByChain(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): Map<string, number> {
  return countChainsAtExtreme(productsData, activeItems, "min");
}

export function findHighestPriceStores(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): Set<string> {
  return new Set(countChainsAtExtreme(productsData, activeItems, "max").keys());
}
