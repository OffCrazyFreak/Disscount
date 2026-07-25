"use client";

import { memo, useState } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductCard from "@/components/custom/product/product-card";
import ProductQuickActions from "@/components/custom/product/product-quick-actions";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import useLongPress from "@/hooks/use-long-press";
import useProductNavigation from "@/hooks/use-product-navigation";

interface IProductItemProps {
  product: ProductResponse;
}

const ProductItem = memo(function ProductItem({ product }: IProductItemProps) {
  const navigateToProduct = useProductNavigation();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const category = getMostFrequentCategory(product);

  const { hasFired, ...pressProps } = useLongPress({
    onLongPress: () => setQuickActionsOpen(true),
  });

  return (
    <>
      <ProductCard
        name={product.name}
        brand={product.brand}
        category={category}
        // A press that opened the sheet must not also navigate on release.
        onClick={() => {
          if (!hasFired()) navigateToProduct(product.ean, product);
        }}
        pressProps={pressProps}
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

      <ProductQuickActions
        product={product}
        open={quickActionsOpen}
        onOpenChange={setQuickActionsOpen}
      />
    </>
  );
});

export default ProductItem;
