import type { ProductResponse, StorePrice } from "@/lib/cijene-api/schemas";
import type {
  IProductListPrice,
  ProductPriceScope,
} from "@/app/products/typings/product-list-price";
import { parsePrice } from "@/app/products/utils/product-price-utils";
import { normalizeChainCode } from "@/app/products/utils/product-filters";
import { getLocationLabel } from "@/utils/labels";
import { normalizeForSearch } from "@/utils/strings";

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
  allowedChains: string[] | null,
): IProductListPrice | null {
  const allowed =
    allowedChains === null
      ? null
      : new Set(allowedChains.map(normalizeChainCode));
  const chains = product.chains.filter(
    (chain) => allowed === null || allowed.has(normalizeChainCode(chain.chain)),
  );
  const prices = chains.flatMap((chain) =>
    [parsePrice(chain.min_price), parsePrice(chain.max_price)].filter(
      (price): price is number => price !== null,
    ),
  );

  return summarizePrices(prices, allowed === null ? "all" : "chains");
}

export function summarizeLocationPrices(
  storePrices: StorePrice[],
  selectedLocations: string[],
  allowedChains: string[],
): Map<string, IProductListPrice> {
  const selectedLocationKeys = new Set(
    selectedLocations.map(normalizeForSearch),
  );
  const allowedChainKeys = new Set(allowedChains.map(normalizeChainCode));
  const pricesByEan = new Map<string, number[]>();

  for (const storePrice of storePrices) {
    const locationKey = normalizeForSearch(
      getLocationLabel(storePrice.store.city),
    );

    if (!selectedLocationKeys.has(locationKey)) continue;
    if (!allowedChainKeys.has(normalizeChainCode(storePrice.chain))) continue;

    const price = parsePrice(
      storePrice.special_price ?? storePrice.regular_price ?? "",
    );
    if (price === null) continue;

    const prices = pricesByEan.get(storePrice.ean) ?? [];
    prices.push(price);
    pricesByEan.set(storePrice.ean, prices);
  }

  return new Map(
    [...pricesByEan].flatMap(([ean, prices]) => {
      const summary = summarizePrices(prices, "locations");
      return summary ? [[ean, summary]] : [];
    }),
  );
}
