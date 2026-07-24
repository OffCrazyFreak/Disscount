import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getMaxPrice,
  getMinPrice,
} from "@/app/products/utils/product-price-utils";

export function getMinPricePerUnit(
  product: ProductResponse,
): number | undefined {
  const quantity = Number(product.quantity);

  if (Number.isFinite(quantity) && quantity > 0) {
    return getMinPrice(product) / quantity;
  }

  return undefined;
}

export function getMaxPricePerUnit(
  product: ProductResponse,
): number | undefined {
  const quantity = Number(product.quantity);

  if (Number.isFinite(quantity) && quantity > 0) {
    return getMaxPrice(product) / quantity;
  }

  return undefined;
}

export function getAveragePricePerUnit(
  product: ProductResponse,
): number | undefined {
  const quantity = Number(product.quantity);

  if (Number.isFinite(quantity) && quantity > 0) {
    return getAveragePrice(product) / quantity;
  }

  return undefined;
}
