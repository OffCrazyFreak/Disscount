import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getMaxPrice,
  getMinPrice,
} from "@/app/products/utils/product-price-utils";

function perUnit(price: number | null, quantity: number): number | undefined {
  if (price === null || !Number.isFinite(quantity) || quantity <= 0) {
    return undefined;
  }

  return price / quantity;
}

export function getMinPricePerUnit(
  product: ProductResponse,
): number | undefined {
  return perUnit(getMinPrice(product), Number(product.quantity));
}

export function getMaxPricePerUnit(
  product: ProductResponse,
): number | undefined {
  return perUnit(getMaxPrice(product), Number(product.quantity));
}

export function getAveragePricePerUnit(
  product: ProductResponse,
): number | undefined {
  return perUnit(getAveragePrice(product), Number(product.quantity));
}
