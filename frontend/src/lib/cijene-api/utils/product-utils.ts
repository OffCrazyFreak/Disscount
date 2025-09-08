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
  const prices = product.chains
    .map((c) => parseFloat(c.min_price))
    .filter((price) => Number.isFinite(price));
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const finalMin = Number.isFinite(min) ? min : 0;
  minPriceCache.set(product, finalMin);
  return finalMin;
};

/**
 * Get maximum price for a product from Cijene API
 */
export const getMaxPrice = (product: ProductResponse): number => {
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
};

/**
 * Get minimum price per unit for a product
 */
export const getMinPricePerUnit = (
  product: ProductResponse
): number | undefined => {
  const quantity = product.quantity ? parseFloat(product.quantity) : undefined;
  if (quantity && Number.isFinite(quantity) && quantity > 0) {
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
  if (quantity && Number.isFinite(quantity) && quantity > 0) {
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
  if (quantity && Number.isFinite(quantity) && quantity > 0) {
    const avgPrice = getAveragePrice(product);
    return avgPrice !== undefined ? avgPrice / quantity : undefined;
  }
  return undefined;
};

/**
 * Check if product has multiple chains
 */
export const hasMultipleChains = (product: ProductResponse): boolean => {
  return product.chains && product.chains.length > 1;
};

/**
 * Get the lowest price chain for a product
 */
export const getLowestPriceChain = (product: ProductResponse) => {
  if (!product.chains || product.chains.length === 0) {
    return undefined;
  }

  const validChains = product.chains.filter((c) =>
    Number.isFinite(parseFloat(c.min_price))
  );

  if (validChains.length === 0) {
    return undefined;
  }

  return validChains.reduce((lowest, current) =>
    parseFloat(current.min_price) < parseFloat(lowest.min_price)
      ? current
      : lowest
  );
};

/**
 * Get the highest price chain for a product
 */
export const getHighestPriceChain = (product: ProductResponse) => {
  if (!product.chains || product.chains.length === 0) {
    return undefined;
  }

  const validChains = product.chains.filter((c) =>
    Number.isFinite(parseFloat(c.min_price))
  );

  if (validChains.length === 0) {
    return undefined;
  }

  return validChains.reduce((highest, current) =>
    parseFloat(current.min_price) > parseFloat(highest.min_price)
      ? current
      : highest
  );
};

/**
 * Get the average price chain for a product
 */
export const getAveragePriceChain = (product: ProductResponse) => {
  if (!product.chains || product.chains.length === 0) {
    return undefined;
  }

  const validChains = product.chains.filter((c) =>
    Number.isFinite(parseFloat(c.avg_price))
  );

  if (validChains.length === 0) {
    return undefined;
  }

  const total = validChains.reduce(
    (sum, current) => sum + parseFloat(current.avg_price),
    0
  );

  const avg = total / validChains.length;
  return Number.isFinite(avg) ? avg : undefined;
};
