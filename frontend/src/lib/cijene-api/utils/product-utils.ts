import { ProductResponse } from "../schemas";

// Memoization caches
const minPriceCache = new WeakMap<ProductResponse, number>();
const maxPriceCache = new WeakMap<ProductResponse, number>();
const avgPriceCache = new WeakMap<ProductResponse, number>();

/**
 * Get minimum price for a product from Cijene API
 */
export const getMinPrice = (product: ProductResponse): number => {
  if (minPriceCache.has(product)) {
    return minPriceCache.get(product)!;
  }
  const min = Math.min(...product.chains.map((c) => parseFloat(c.min_price)));
  minPriceCache.set(product, min);
  return min;
};

/**
 * Get maximum price for a product from Cijene API
 */
export const getMaxPrice = (product: ProductResponse): number => {
  if (maxPriceCache.has(product)) {
    return maxPriceCache.get(product)!;
  }
  const max =
    Math.max(...product.chains.map((c) => parseFloat(c.max_price))) || 0;
  maxPriceCache.set(product, max);
  return max;
};

/**
 * Get average price for a product from Cijene API
 */
export const getAveragePrice = (
  product: ProductResponse
): number | undefined => {
  if (avgPriceCache.has(product)) {
    return avgPriceCache.get(product)!;
  }
  if (product.chains.length > 0) {
    const avg =
      product.chains.reduce((sum, c) => sum + parseFloat(c.avg_price), 0) /
      product.chains.length;
    avgPriceCache.set(product, avg);
    return avg;
  }
  return undefined;
};

/**
 * Get minimum price per unit for a product
 */
export const getMinPricePerUnit = (
  product: ProductResponse
): number | undefined => {
  const quantity = product.quantity ? parseFloat(product.quantity) : undefined;
  if (quantity && quantity > 0) {
    return getMinPrice(product) / quantity;
  }
  return undefined;
};

/**
 * Get maximum price per unit for a product
 */
export const getMaxPricePerUnit = (
  product: ProductResponse
): number | undefined => {
  const quantity = product.quantity ? parseFloat(product.quantity) : undefined;
  if (quantity && quantity > 0) {
    return getMaxPrice(product) / quantity;
  }
  return undefined;
};

/**
 * Get average price per unit for a product
 */
export const getAveragePricePerUnit = (
  product: ProductResponse
): number | undefined => {
  const quantity = product.quantity ? parseFloat(product.quantity) : undefined;
  if (quantity && quantity > 0) {
    const avgPrice = getAveragePrice(product);
    return avgPrice !== undefined ? avgPrice / quantity : undefined;
  }
  return undefined;
};

/**
 * Check if product has multiple chains
 */
export const hasMultipleChains = (product: ProductResponse): boolean => {
  return product.chains.length > 1;
};

/**
 * Get the lowest price chain for a product
 */
export const getLowestPriceChain = (product: ProductResponse) => {
  if (product.chains.length === 0) {
    return undefined;
  }

  return product.chains.reduce((lowest, current) =>
    parseFloat(current.min_price) < parseFloat(lowest.min_price)
      ? current
      : lowest
  );
};

/**
 * Get the highest price chain for a product
 */
export const getHighestPriceChain = (product: ProductResponse) => {
  if (product.chains.length === 0) {
    return undefined;
  }

  return product.chains.reduce((highest, current) =>
    parseFloat(current.min_price) > parseFloat(highest.min_price)
      ? current
      : highest
  );
};

/**
 * Get the average price chain for a product
 */
export const getAveragePriceChain = (product: ProductResponse) => {
  if (product.chains.length === 0) {
    return undefined;
  }

  const total = product.chains.reduce(
    (sum, current) => sum + parseFloat(current.avg_price),
    0
  );

  return total / product.chains.length;
};
