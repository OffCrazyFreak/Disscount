import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type {
  IProductListPrice,
  ProductPriceScope,
} from "@/features/products/typings/product-list-price-types";
import { normalizeChainCode } from "@/features/products/utils/product-filters";

function summarizePrices(
  prices: number[],
  scope: ProductPriceScope,
): IProductListPrice | null {
  if (prices.length === 0) return null;

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    scope,
  };
}

export function summarizeChainPrices(
  product: ProductResponse,
  allowedChainKeys: ReadonlySet<string> | null,
): IProductListPrice | null {
  const chains = product.chains.filter(
    (chain) =>
      allowedChainKeys === null ||
      allowedChainKeys.has(normalizeChainCode(chain.chain)),
  );
  const prices = chains.flatMap((chain) => [chain.min_price, chain.max_price]);

  return summarizePrices(prices, allowedChainKeys === null ? "all" : "chains");
}
