"use client";

import { memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { ProductCard } from "@/app/products/components/product-card/product-card";

interface ProductListProps {
  products: ProductResponse[];
  viewMode: "grid" | "list";
}

export const ProductList = memo(function ProductList({
  products,
  viewMode,
}: ProductListProps) {
  const columns = 2;
  const rowCount =
    viewMode === "grid"
      ? Math.ceil(products.length / columns)
      : products.length;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () =>
      document.scrollingElement || document.documentElement,
    estimateSize: () => (viewMode === "grid" ? 140 : 100),
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      style={{
        height: virtualizer.getTotalSize(),
        width: "100%",
        position: "relative",
      }}
    >
      {viewMode === "grid" ? (
        <div className="absolute top-0 left-0 w-full">
          {virtualItems.map((virtualRow) => {
            const startIndex = virtualRow.index * columns;
            const endIndex = Math.min(startIndex + columns, products.length);
            const rowProducts = products.slice(startIndex, endIndex);

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-0"
                style={{
                  position: "absolute",
                  top: virtualRow.start,
                  left: 0,
                  width: "100%",
                  minHeight: virtualRow.size,
                }}
              >
                {rowProducts.map((product) => (
                  <ProductCard key={product.ean} product={product} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="absolute top-0 left-0 w-full">
          {virtualItems.map((virtualRow) => {
            const product = products[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: virtualRow.start,
                  left: 0,
                  width: "100%",
                  minHeight: virtualRow.size,
                }}
                className="space-y-2"
              >
                <ProductCard product={product} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
