import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";

const minPriceCache = new WeakMap<ProductResponse, number | null>();
const maxPriceCache = new WeakMap<ProductResponse, number | null>();
const avgPriceCache = new WeakMap<ProductResponse, number | null>();

/** Upstream sometimes publishes 0.00 for a chain, which is no price at all and an error in Google's offers. */
export function parsePrice(value: string): number | null {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

/** `price_date` is a Croatian calendar date, whatever zone the device runs in. */
export function isPriceDateToday(priceDate: string): boolean {
  return priceDate === zagrebClock(new Date()).date;
}

/** ISO dates sort as text, so the largest is the day a chain last published this product's prices. */
export function getNewestPriceDate(product: ProductResponse): string | null {
  return product.chains.reduce<string | null>(
    (newest, chain) =>
      newest === null || chain.price_date > newest ? chain.price_date : newest,
    null,
  );
}

export function getMinPrice(product: ProductResponse): number | null {
  if (minPriceCache.has(product)) {
    return minPriceCache.get(product)!;
  }

  const prices = product.chains
    .map((chain) => parsePrice(chain.min_price))
    .filter((price): price is number => price !== null);
  const min = prices.length > 0 ? Math.min(...prices) : null;

  minPriceCache.set(product, min);
  return min;
}

export function getMaxPrice(product: ProductResponse): number | null {
  if (maxPriceCache.has(product)) {
    return maxPriceCache.get(product)!;
  }

  const prices = product.chains
    .map((chain) => parsePrice(chain.max_price))
    .filter((price): price is number => price !== null);
  const max = prices.length > 0 ? Math.max(...prices) : null;

  maxPriceCache.set(product, max);
  return max;
}

export function getAveragePrice(product: ProductResponse): number | null {
  if (avgPriceCache.has(product)) {
    return avgPriceCache.get(product)!;
  }

  const prices = product.chains
    .map((chain) => parsePrice(chain.avg_price))
    .filter((price): price is number => price !== null);
  const avg =
    prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : null;

  avgPriceCache.set(product, avg);
  return avg;
}

export function getChainAvgPriceRange(
  product: ProductResponse | undefined,
): { min: number; max: number } | null {
  const prices = (product?.chains ?? [])
    .map((chain) => parsePrice(chain.avg_price))
    .filter((price): price is number => price !== null);

  if (prices.length === 0) return null;

  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getCheapestChainByMinPrice(
  chains: ChainProductResponse[],
): { chain: ChainProductResponse; price: number } | null {
  const pricedChains: Array<{ chain: ChainProductResponse; price: number }> =
    [];

  for (const chain of chains) {
    const price = parsePrice(chain.min_price);

    if (price !== null) {
      pricedChains.push({ chain, price });
    }
  }

  if (pricedChains.length === 0) {
    return null;
  }

  return pricedChains.reduce((lowest, current) =>
    current.price < lowest.price ? current : lowest,
  );
}
