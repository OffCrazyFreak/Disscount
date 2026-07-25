"use client";

import { memo, useState } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductCard from "@/components/custom/product/product-card";
import ProductQuickActions from "@/components/custom/product/product-quick-actions";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import useProductNavigation from "@/hooks/use-product-navigation";

interface IProductItemProps {
  product: ProductResponse;
}

const ProductItem = memo(function ProductItem({ product }: IProductItemProps) {
  const navigateToProduct = useProductNavigation();
  const [areQuickActionsOpen, setQuickActionsOpen] = useState(false);

  const category = getMostFrequentCategory(product);

  return (
    <>
      <ProductQuickActions
        product={product}
        open={areQuickActionsOpen}
        onOpenChange={setQuickActionsOpen}
      />

      <ProductCard
        name={product.name}
        brand={product.brand}
        category={category}
        onClick={() => navigateToProduct(product.ean, product)}
        onLongPress={() => setQuickActionsOpen(true)}
        trailing={
          <>
            <ProductUnitPriceDetails product={product} />

            <ProductActionButtons
              product={product}
              showSearchImage={true}
              showAddToList={true}
              showAddToWatchlist={false}
              className="flex-col sm:flex-row"
            />
          </>
        }
      />
    </>
  );
});

export default ProductItem;
