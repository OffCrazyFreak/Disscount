"use client";

import { memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { ProductInfo } from "@/app/products/components/product-item/product-info";
import { ProductUnitPriceDetails } from "@/app/products/components/product-item/product-price";
import { ViewMode } from "@/typings/view-mode";
import { useQueryClient } from "@tanstack/react-query";
import ProductActionButtons from "@/app/products/components/product-action-buttons";

interface IProductItemProps {
  product: ProductResponse;
  viewMode: ViewMode;
}

export const ProductItem = memo<IProductItemProps>(({ product, viewMode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const handleProductClick = () => {
    // Pre-populate the React Query cache with the product data
    queryClient.setQueryData(
      ["cijene", "product", "ean", JSON.stringify({ ean: product.ean })],
      product,
    );

    // Navigate to the product details page
    router.push(`/products/${product.ean}`);
  };

  return (
    <Card
      onClick={handleProductClick}
      className="cursor-pointer px-3 sm:px-6 py-2 sm:py-4 hover:shadow-lg shadow-sm transition-shadow"
    >
      <div className="flex sm:items-center justify-between gap-2 sm:gap-4 flex-col sm:flex-row">
        <div className="flex items-center justify-between sm:gap-8 gap-4 flex-1">
          {/* TODO: Product Image */}
          {/* <div className="size-20 bg-gray-100 rounded-lg hidden sm:grid place-items-center">
              <span className="text-gray-400">IMG</span>
            </div> */}

          <ProductInfo
            name={product.name}
            brand={product.brand}
            category={category}
          />

          <ProductUnitPriceDetails product={product} />

          {/* Icon buttons */}
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <ProductActionButtons
              product={product}
              showSearchImage={true}
              showAddToList={true}
              showAddToWatchList={false}
              className="flex-col sm:flex-row"
            />
          </div>
        </div>
      </div>
    </Card>
  );
});

ProductItem.displayName = "ProductItem";
