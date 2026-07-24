"use client";

import { memo } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductCard from "@/components/custom/product/product-card";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import useProductNavigation from "@/hooks/use-product-navigation";

interface IProductItemProps {
  product: ProductResponse;
}

const ProductItem = memo(function ProductItem({ product }: IProductItemProps) {
  const navigateToProduct = useProductNavigation();

  const category = getMostFrequentCategory(product);

  return (
    <ProductCard
      name={product.name}
      brand={product.brand}
      category={category}
      onClick={() => navigateToProduct(product.ean, product)}
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
  );
});

export default ProductItem;
