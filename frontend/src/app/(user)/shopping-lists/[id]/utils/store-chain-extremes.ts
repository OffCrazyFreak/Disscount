import { ShoppingListItemDto } from "@/lib/api/types";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getPriceExtreme,
  type PriceExtreme,
} from "@/app/products/utils/product-utils";

// How many list products hit their extreme average price at each chain, judged by
// the same rule the price cells use, so a chain never earns a badge without a
// marked row behind it.
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

    const prices = product.chains
      .map((chain) => parseFloat(chain.avg_price))
      .filter((price) => !isNaN(price));
    if (prices.length === 0) return;

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    product.chains.forEach((chain) => {
      if (getPriceExtreme(parseFloat(chain.avg_price), min, max) !== extreme) {
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
