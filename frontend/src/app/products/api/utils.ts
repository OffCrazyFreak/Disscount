import { ProductResponse } from "./schemas";

/**
 * Get price range for a product from Cijene API
 */
export const getPriceRange = (product: ProductResponse): string | undefined => {
  if (product.chains.length === 0) return undefined;

  const minPrice = Math.min(
    ...product.chains.map((c) => parseFloat(c.min_price))
  );
  const maxPrice = Math.max(
    ...product.chains.map((c) => parseFloat(c.max_price))
  );

  if (minPrice === maxPrice) {
    return `${minPrice.toFixed(2)} €`;
  }
  return `${minPrice.toFixed(2)} € - ${maxPrice.toFixed(2)} €`;
};

/**
 * Get minimum price for a product from Cijene API
 */
export const getMinPrice = (product: ProductResponse): number | undefined => {
  return product.chains.length > 0
    ? Math.min(...product.chains.map((c) => parseFloat(c.min_price)))
    : undefined;
};

/**
 * Get maximum price for a product from Cijene API
 * @param product
 * @returns
 */
export const getMaxPrice = (product: ProductResponse): number | undefined => {
  return product.chains.length > 0
    ? Math.max(...product.chains.map((c) => parseFloat(c.max_price)))
    : undefined;
};

/**
 * Get average price for a product from Cijene API
 */
export const getAveragePrice = (
  product: ProductResponse
): number | undefined => {
  return product.chains.length > 0
    ? product.chains.reduce((sum, c) => sum + parseFloat(c.avg_price), 0) /
        product.chains.length
    : undefined;
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
