"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import ProductItem from "@/app/[locale]/products/components/product-item/product-item";
import type { IProductListItem } from "@/app/[locale]/products/typings/product-list-price-types";
import type { ViewMode } from "@/typings/view-mode";

interface IProductsGridProps {
  items: IProductListItem[];
  viewMode: ViewMode;
}

export default function ProductsGrid({ items, viewMode }: IProductsGridProps) {
  const isMobile = useIsMobile();
  const isList = viewMode !== "grid" || isMobile;

  return (
    <div
      className={`${
        isList ? "space-y-4" : "grid grid-cols-2 sm:grid-cols-3 gap-4"
      }`}
    >
      {items.map(({ product, price }) => (
        <div key={product.ean} className={`${isList ? "w-full" : "w-76"}`}>
          <ProductItem product={product} price={price} />
        </div>
      ))}
    </div>
  );
}
