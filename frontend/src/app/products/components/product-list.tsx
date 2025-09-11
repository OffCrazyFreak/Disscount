"use client";

import { memo } from "react";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { ProductCard } from "@/app/products/components/product-card/product-card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductListProps {
  visibleProducts: ProductResponse[];
  viewMode: "grid" | "list";
}

export const ProductList = memo(function ProductList({
  visibleProducts,
  viewMode,
}: ProductListProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`${
        viewMode !== "grid" || isMobile
          ? "space-y-4"
          : "grid grid-cols-2 sm:grid-cols-3 gap-4"
      }`}
    >
      {visibleProducts.map((product) => (
        <div
          key={product.ean}
          className={`${viewMode !== "grid" || isMobile ? "w-full" : "w-76"}`}
        >
          <ProductCard product={product} viewMode={viewMode} />
        </div>
      ))}
    </div>
  );
});
