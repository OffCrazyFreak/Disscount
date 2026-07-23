import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { ShoppingListItemRequest } from "@/lib/api/schemas/shopping-list-item";
import type {
  AddToListFormData,
  IProductPricing,
} from "@/app/products/typings/add-to-list";

export function buildShoppingListItemRequest(
  product: ProductResponse,
  data: AddToListFormData,
  pricing: IProductPricing,
): ShoppingListItemRequest {
  const request: ShoppingListItemRequest = {
    ean: product.ean,
    name: product.name || "",
    brand: product.brand || undefined,
    quantity: product.quantity || undefined,
    unit: product.unit || undefined,
    amount: Number.parseInt(data.amount, 10),
    isChecked: data.isChecked,
  };

  if (!data.isChecked) return request;

  const chainCode = data.chainCode || pricing.cheapestStore;
  if (!chainCode) return request;

  return {
    ...request,
    chainCode,
    avgPrice: pricing.averagePrice ?? undefined,
    storePrice: pricing.storePrices[chainCode],
  };
}
