import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

// Memoization caches
const minPriceCache = new WeakMap<ProductResponse, number>();
const maxPriceCache = new WeakMap<ProductResponse, number>();
const avgPriceCache = new WeakMap<ProductResponse, number>();

/**
 * Get minimum price for a product from Cijene API
 */
export function getMinPrice(product: ProductResponse): number {
  if (minPriceCache.has(product)) {
    return minPriceCache.get(product)!;
  }
  const prices = product.chains
    .map((c) => parseFloat(c.min_price))
    .filter((price) => Number.isFinite(price));
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const finalMin = Number.isFinite(min) ? min : 0;
  minPriceCache.set(product, finalMin);
  return finalMin;
}

/**
 * Get maximum price for a product from Cijene API
 */
export function getMaxPrice(product: ProductResponse): number {
  if (maxPriceCache.has(product)) {
    return maxPriceCache.get(product)!;
  }
  const prices = product.chains
    .map((c) => parseFloat(c.max_price))
    .filter((price) => Number.isFinite(price));
  const max = prices.length > 0 ? Math.max(...prices) : 0;
  const finalMax = Number.isFinite(max) ? max : 0;
  maxPriceCache.set(product, finalMax);
  return finalMax;
}

/**
 * Get average price for a product from Cijene API
 */
export function getAveragePrice(product: ProductResponse): number {
  if (avgPriceCache.has(product)) {
    return avgPriceCache.get(product)!;
  }
  if (product.chains.length > 0) {
    let sum = 0;
    let count = 0;
    for (const chain of product.chains) {
      const parsed = parseFloat(chain.avg_price);
      if (Number.isFinite(parsed)) {
        sum += parsed;
        count += 1;
      }
    }

    const avg = sum / count;
    if (Number.isFinite(avg)) {
      avgPriceCache.set(product, avg);
      return avg;
    }
  }
  return 0;
}

/**
 * Parse price value from API string.
 */
export function parsePrice(value: string): number | null {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Get cheapest chain and its min price from a chain list.
 */
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

  return pricedChains.reduce((lowest, current) => {
    if (current.price < lowest.price) {
      return current;
    }

    return lowest;
  });
}

/**
 * Get minimum price per unit for a product
 */
export function getMinPricePerUnit(
  product: ProductResponse,
): number | undefined {
  const quantity = Number(product.quantity);
  if (Number.isFinite(quantity) && quantity > 0) {
    return getMinPrice(product) / quantity;
  }
  return undefined;
}

/**
 * Get maximum price per unit for a product
 */
export function getMaxPricePerUnit(
  product: ProductResponse,
): number | undefined {
  const quantity = Number(product.quantity);
  if (Number.isFinite(quantity) && quantity > 0) {
    return getMaxPrice(product) / quantity;
  }
  return undefined;
}

/**
 * Get average price per unit for a product
 */
export function getAveragePricePerUnit(
  product: ProductResponse,
): number | undefined {
  const quantity = Number(product.quantity);
  if (Number.isFinite(quantity) && quantity > 0) {
    const avgPrice = getAveragePrice(product);
    if (avgPrice !== undefined) {
      return avgPrice / quantity;
    }
  }
  return undefined;
}

export type PriceExtreme = "min" | "max" | null;

/**
 * Classify a price against a range's overall min/max.
 * Returns null when the value is neither extreme, OR when min === max — a
 * uniform price has no cheapest/most-expensive distinction to color, so every
 * view renders it neutrally instead of disagreeing (red vs green).
 */
export function getPriceExtreme(
  value: number,
  min: number,
  max: number,
): PriceExtreme {
  if (![value, min, max].every(Number.isFinite)) {
    return null;
  }
  if (min === max) {
    return null;
  }
  if (value === min) {
    return "min";
  }
  if (value === max) {
    return "max";
  }
  return null;
}

/**
 * Calculate price change difference and percentage
 */
export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number,
) {
  const percentage = Math.abs(
    ((currentPrice - previousPrice) / previousPrice) * 100,
  );
  const difference = Number((currentPrice - previousPrice).toFixed(2));

  return {
    percentage,
    difference,
  };
}
