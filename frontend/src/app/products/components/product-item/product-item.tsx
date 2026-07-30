"use client";

import { memo } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductCard from "@/components/custom/product/product-card";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import useLongPress from "@/hooks/use-long-press";
import useProductModals from "@/hooks/use-product-modals";
import { usePrimeProductNavigation } from "@/hooks/use-product-navigation";

interface IProductItemProps {
  product: ProductResponse;
}

const ProductItem = memo(function ProductItem({ product }: IProductItemProps) {
  const primeProductNavigation = usePrimeProductNavigation();
  const { openQuickActions } = useProductModals(product);

  const category = getMostFrequentCategory(product);

  const { hasFired, ...pressProps } = useLongPress({
    onLongPress: openQuickActions,
  });

  return (
    <ProductCard
      ean={product.ean}
      name={product.name}
      brand={product.brand}
      category={category}
      // A press that opened the sheet must not also navigate on release. The
      // keyboard path skips the guard, since hasFired stays true until the next
      // pointerdown and Enter would otherwise be swallowed for good.
      onNavigate={(viaKeyboard) => {
        if (!viaKeyboard && hasFired()) return false;

        primeProductNavigation(product.ean, product);
      }}
      pressProps={pressProps}
      trailing={<ProductUnitPriceDetails product={product} />}
      actions={<ProductActionButtons product={product} grouped />}
    />
  );
});

export default ProductItem;
