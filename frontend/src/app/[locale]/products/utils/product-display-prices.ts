import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { IProductListPrice } from "@/app/[locale]/products/typings/product-list-price-types";
import {
  getMaxPrice,
  getMaxPricePerUnit,
  getMinPrice,
  getMinPricePerUnit,
  getPricePerUnit,
} from "@/app/[locale]/products/utils/product-utils";

interface IDisplayPrices {
  minPrice: number | null;
  maxPrice: number | null;
  minPricePerUnit: number | undefined;
  maxPricePerUnit: number | undefined;
}

// An undefined list price means no override, while null means the filters left no price.
export function getDisplayPrices(
  product: ProductResponse,
  price: IProductListPrice | null | undefined,
): IDisplayPrices {
  if (price === undefined) {
    return {
      minPrice: getMinPrice(product),
      maxPrice: getMaxPrice(product),
      minPricePerUnit: getMinPricePerUnit(product),
      maxPricePerUnit: getMaxPricePerUnit(product),
    };
  }

  const minPrice = price?.minPrice ?? null;
  const maxPrice = price?.maxPrice ?? null;
  const quantity = Number(product.quantity);

  return {
    minPrice,
    maxPrice,
    minPricePerUnit: getPricePerUnit(minPrice, quantity),
    maxPricePerUnit: getPricePerUnit(maxPrice, quantity),
  };
}
