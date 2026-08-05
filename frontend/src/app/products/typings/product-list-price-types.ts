import type { ProductResponse } from "@/lib/cijene-api/schemas";

export type ProductPriceScope = "all" | "chains" | "locations";

export interface IProductListPrice {
  minPrice: number;
  maxPrice: number;
  scope: ProductPriceScope;
}

export interface IProductListItem {
  product: ProductResponse;
  price: IProductListPrice | null;
}
