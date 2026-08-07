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
import type { IProductListPrice } from "@/app/products/typings/product-list-price-types";

interface IProductItemProps {
  product: ProductResponse;
  price: IProductListPrice | null;
}

const ProductItem = memo(function ProductItem({
  product,
  price,
}: IProductItemProps) {
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
      trailing={<ProductUnitPriceDetails product={product} price={price} />}
      // Precise pointers on a wide enough viewport. Four 40px buttons crowd a
      // phone-width row that already carries the price block, and a narrow
      // window looks the same whatever is driving it, so the viewport has to
      // count as well as the pointer. Everywhere else the card opens, and the
      // product page carries the same four actions.
      actions={<ProductActionButtons product={product} />}
      actionsClassName="hidden pointer-fine:sm:flex"
    />
  );
});

export default ProductItem;
