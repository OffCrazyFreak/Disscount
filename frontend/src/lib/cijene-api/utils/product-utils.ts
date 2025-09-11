import { ProductResponse } from "../schemas";

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
export function getAveragePrice(product: ProductResponse): number | undefined {
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
    if (count === 0) {
      return undefined;
    }
    const avg = sum / count;
    if (Number.isFinite(avg)) {
      avgPriceCache.set(product, avg);
      return avg;
    }
  }
  return undefined;
}

/**
 * Get minimum price per unit for a product
 */
export function getMinPricePerUnit(
  product: ProductResponse
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
  product: ProductResponse
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
  product: ProductResponse
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

/**
 * Check if product has multiple chains
 */
export function hasMultipleChains(product: ProductResponse): boolean {
  return (product.chains?.length ?? 0) > 1;
}

/**
 * Get the lowest price chain for a product
 */
export function getLowestPriceChain(product: ProductResponse) {
  if (!product.chains || product.chains.length === 0) {
    return undefined;
  }

  const validChains = product.chains.filter((c) =>
    Number.isFinite(parseFloat(c.min_price))
  );

  if (validChains.length === 0) {
    return undefined;
  }

  return validChains.reduce((lowest, current) => {
    const currentPrice = parseFloat(current.min_price);
    const lowestPrice = parseFloat(lowest.min_price);
    return currentPrice < lowestPrice ? current : lowest;
  });
}

/**
 * Get the highest price chain for a product
 */
export function getHighestPriceChain(product: ProductResponse) {
  if (!product.chains || product.chains.length === 0) {
    return undefined;
  }

  const validChains = product.chains.filter((c) =>
    Number.isFinite(parseFloat(c.max_price))
  );

  if (validChains.length === 0) {
    return undefined;
  }

  return validChains.reduce((highest, current) => {
    const currentPrice = parseFloat(current.max_price);
    const highestPrice = parseFloat(highest.max_price);
    return currentPrice > highestPrice ? current : highest;
  });
}

/**
 * Calculate price change difference and percentage
 */
export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
) {
  const percentage = ((currentPrice - previousPrice) / previousPrice) * 100;
  const difference = currentPrice - previousPrice;

  return {
    percentage,
    difference,
  };
}
