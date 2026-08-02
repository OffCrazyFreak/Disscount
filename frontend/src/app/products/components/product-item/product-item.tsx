"use client";

import { memo } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductCard from "@/components/custom/product/product-card";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import useCardLongPress from "@/hooks/use-card-long-press";
import useProductModals from "@/hooks/use-product-modals";
import { usePrimeProductNavigation } from "@/hooks/use-product-navigation";

interface IProductItemProps {
  product: ProductResponse;
}

const ProductItem = memo(function ProductItem({ product }: IProductItemProps) {
  const primeProductNavigation = usePrimeProductNavigation();
  const { openQuickActions } = useProductModals(product);

  const category = getMostFrequentCategory(product);

  const { pressProps, actionProps, cancelNavigationAfterPress } =
    useCardLongPress(openQuickActions);

  return (
    <ProductCard
      ean={product.ean}
      name={product.name}
      brand={product.brand}
      category={category}
      onNavigate={(viaKeyboard) => {
        if (cancelNavigationAfterPress(viaKeyboard) === false) return false;

        primeProductNavigation(product.ean, product);
      }}
      pressProps={pressProps}
      actionProps={actionProps}
      trailing={<ProductUnitPriceDetails product={product} />}
      // Desktop only. Touch reaches the same four actions by holding the card,
      // which the progress ring advertises; four 40px buttons would crowd a
      // phone-width row that already carries the price block.
      actions={
        <ProductActionButtons product={product} className="hidden sm:flex" />
      }
    />
  );
});

export default ProductItem;
