import { ShoppingListItemDto } from "@/lib/api/types";
import { ProductResponse } from "@/lib/cijene-api/schemas";

// How many list products hit their extreme average price at each chain.
function countChainsAtExtreme(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
  pickExtreme: (prices: number[]) => number,
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

    const extreme = pickExtreme(prices);

    product.chains.forEach((chain) => {
      if (parseFloat(chain.avg_price) !== extreme) return;
      counts.set(chain.chain, (counts.get(chain.chain) ?? 0) + 1);
    });
  });

  return counts;
}

export function countCheapestByChain(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): Map<string, number> {
  return countChainsAtExtreme(productsData, activeItems, (prices) =>
    Math.min(...prices),
  );
}

export function findHighestPriceStores(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): Set<string> {
  const counts = countChainsAtExtreme(productsData, activeItems, (prices) =>
    Math.max(...prices),
  );

  return new Set(counts.keys());
}
