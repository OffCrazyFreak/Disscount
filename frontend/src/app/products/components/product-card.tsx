"use client";

import { memo, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button-icon";
import { ListPlus } from "lucide-react";
import { ProductResponse } from "@/app/products/api/schemas";
import { ProductInfo } from "@/app/products/components/product-card/product-info";
import { ProductPrice } from "@/app/products/components/product-card/product-price";

interface ProductCardProps {
  product: ProductResponse;
}

export const ProductCard = memo<ProductCardProps>(({ product }) => {
  // Get category that appears most often in product.chains
  const category = useMemo(() => {
    if (!product.chains || product.chains.length === 0) return null;

    const categoryCount: Record<string, number> = {};

    // Count frequency of each category
    product.chains.forEach((chain) => {
      if (chain.category) {
        categoryCount[chain.category] =
          (categoryCount[chain.category] || 0) + 1;
      }
    });

    // Find category with highest count
    let mostFrequentCategory = null;
    let maxCount = 0;

    for (const [cat, count] of Object.entries(categoryCount)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentCategory = cat;
      }
    }

    return mostFrequentCategory;
  }, [product.chains]);

  function handleAddToList() {
    // TODO
  }

  console.log("Rendering ProductCard for", product);

  return (
    <Card className="px-4 sm:px-6 py-2 sm:py-4 hover:shadow-md hover:scale-101 transition-shadow transition-transform">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          {/* Product Image */}
          <div className="size-20 bg-gray-100 rounded-lg hidden sm:grid place-items-center">
            <span className="text-gray-400">IMG</span>
          </div>

          <ProductInfo
            name={product.name}
            brand={product.brand}
            category={category}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <ProductPrice product={product} />

          <Button
            variant="default"
            className="p-2 size-12"
            onClick={handleAddToList}
          >
            <ListPlus className="size-7" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
