"use client";

import { memo } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductCard from "@/components/custom/product/product-card";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import useLongPress from "@/hooks/use-long-press";
import useProductModals from "@/hooks/use-product-modals";
import useProductNavigation from "@/hooks/use-product-navigation";

interface IProductItemProps {
  product: ProductResponse;
}

const ProductItem = memo(function ProductItem({ product }: IProductItemProps) {
  const navigateToProduct = useProductNavigation();
  const { openQuickActions } = useProductModals(product);

  const category = getMostFrequentCategory(product);

  const { hasFired, ...pressProps } = useLongPress({
    onLongPress: openQuickActions,
  });

  return (
    <ProductCard
      name={product.name}
      brand={product.brand}
      category={category}
      // A press that opened the sheet must not also navigate on release. The
      // keyboard path skips the guard, since hasFired stays true until the next
      // pointerdown and Enter would otherwise be swallowed for good.
      onClick={(viaKeyboard) => {
        if (viaKeyboard || !hasFired()) navigateToProduct(product.ean, product);
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
            // Sharing lives on the product's own page and in its quick-actions
            // sheet; a list row does not need a third way in.
            showShare={false}
            className="flex-col sm:flex-row"
          />
        </>
      }
    />
  );
});

export default ProductItem;
