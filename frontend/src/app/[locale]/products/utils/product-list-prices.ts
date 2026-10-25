import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type {
  IProductListPrice,
  ProductPriceScope,
} from "@/app/[locale]/products/typings/product-list-price-types";
import { parsePrice } from "@/utils/product-price-utils";
import { normalizeChainCode } from "@/app/[locale]/products/utils/product-filters";

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
  const prices = chains.flatMap((chain) =>
    [parsePrice(chain.min_price), parsePrice(chain.max_price)].filter(
      (price): price is number => price !== null,
    ),
  );

  return summarizePrices(prices, allowedChainKeys === null ? "all" : "chains");
}
