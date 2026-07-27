"use client";

import { memo } from "react";
import { ChevronRight } from "lucide-react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { Button } from "@/components/ui/button";
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

  function openProduct() {
    navigateToProduct(product.ean, product);
  }

  return (
    <ProductCard
      name={product.name}
      brand={product.brand}
      category={category}
      // A press that opened the sheet must not also navigate on release. The
      // keyboard path skips the guard, since hasFired stays true until the next
      // pointerdown and Enter would otherwise be swallowed for good.
      onClick={(viaKeyboard) => {
        if (viaKeyboard || !hasFired()) openProduct();
      }}
      pressProps={pressProps}
      trailing={
        <>
          <ProductUnitPriceDetails product={product} />

          <Button
            type="button"
            size="icon"
            variant="primarySoft"
            aria-label="Otvori detalje proizvoda"
            onClick={openProduct}
            className="size-10 shrink-0 rounded-full sm:hidden"
          >
            <ChevronRight aria-hidden="true" className="size-6" />
          </Button>

          <ProductActionButtons product={product} grouped />
        </>
      }
    />
  );
});

export default ProductItem;
