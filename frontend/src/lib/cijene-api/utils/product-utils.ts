import {
  ProductResponse,
  ChainProductResponse,
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

  const minPrice = product.chains.map((c) => c.min_price);
  const productMinPrice = Math.min(...minPrice);

  minPriceCache.set(product, productMinPrice);
  return productMinPrice;
}

/**
 * Get maximum price for a product from Cijene API
 */
export function getMaxPrice(product: ProductResponse): number {
  if (maxPriceCache.has(product)) {
    return maxPriceCache.get(product)!;
  }

  const maxPrices = product.chains.map((c) => c.max_price);
  const productMaxPrice = Math.max(...maxPrices);

  maxPriceCache.set(product, productMaxPrice);
  return productMaxPrice;
}

/**
 * Get average price for a product from Cijene API
 */
export function getAveragePrice(product: ProductResponse): number {
  if (avgPriceCache.has(product)) {
    return avgPriceCache.get(product)!;
  }

  let sum = 0;
  let count = 0;
  for (const chain of product.chains) {
    sum += chain.avg_price;
    count += 1;
  }

  const productAvgPrice = sum / count;
  avgPriceCache.set(product, productAvgPrice);
  return productAvgPrice;
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
export function getLowestPriceChain(
  product: ProductResponse
): ChainProductResponse {
  return product.chains.reduce((lowest, current) => {
    const currentPrice = current.min_price;
    const lowestPrice = lowest.min_price;
    return currentPrice < lowestPrice ? current : lowest;
  });
}

/**
 * Get the highest price chain for a product
 */
export function getHighestPriceChain(
  product: ProductResponse
): ChainProductResponse {
  return product.chains.reduce((highest, current) => {
    const currentPrice = current.max_price;
    const highestPrice = highest.max_price;
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
  const percentage = Number(
    Math.abs(((currentPrice - previousPrice) / previousPrice) * 100).toFixed(2)
  );
  const difference = Number((currentPrice - previousPrice).toFixed(2));

  return {
    percentage,
    difference,
  };
}
