"use client";

import { memo, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button-icon";
import { ListPlus } from "lucide-react";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { ProductInfo } from "@/app/products/components/product-item/product-info";
import { ProductPrice } from "@/app/products/components/product-item/product-price";
import AddToShoppingListForm from "@/app/products/components/forms/add-to-shopping-list-form";
import { ViewMode } from "@/typings/view-mode";
import { useQueryClient } from "@tanstack/react-query";

interface IProductItemProps {
  product: ProductResponse;
  viewMode: ViewMode;
}

export const ProductItem = memo<IProductItemProps>(({ product, viewMode }) => {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
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
      product
    );

    // Navigate to the product details page
    router.push(`/products/${product.ean}`);
  };

  return (
    <>
      <AddToShoppingListForm
        isOpen={isAddToListModalOpen}
        onOpenChange={setIsAddToListModalOpen}
        product={product}
      />

      <Card
        onClick={handleProductClick}
        className="cursor-pointer px-4 sm:px-6 py-2 sm:py-4 hover:shadow-lg shadow-sm transition-shadow"
      >
        <div
          className={`${
            viewMode === "grid" ? "flex-col" : "flex-row"
          } flex items-center justify-between gap-4`}
        >
          <div
            className={`${
              viewMode === "grid" ? "flex-col" : "flex-row"
            } flex items-center justify-between gap-4`}
          >
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
              aria-label="Dodaj na popis za kupnju"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();

                setIsAddToListModalOpen(true);
              }}
              type="button"
            >
              <ListPlus className="size-7" />
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
});

ProductItem.displayName = "ProductItem";
