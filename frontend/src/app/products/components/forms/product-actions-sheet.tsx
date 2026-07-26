"use client";

import cijeneService from "@/lib/cijene-api";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductQuickActions from "@/components/custom/product/product-quick-actions";
import ProductSummary from "@/components/custom/product/product-summary";
import { useModalUrl } from "@/lib/modal/use-modal-url";

interface IProductActionsSheetProps {
  open: boolean;
  ean: string;
}

/**
 * The URL-driven half of the quick-actions sheet: it resolves the product the
 * link names and lends the sheet the price display, which belongs to this
 * feature rather than to the shared sheet.
 *
 * The opener seeds the by-ean cache, so a long press opens this instantly and
 * only a cold shared link actually fetches.
 */
export default function ProductActionsSheet({
  open,
  ean,
}: IProductActionsSheetProps) {
  const { closeModal } = useModalUrl();
  const { data: product } = cijeneService.useGetProductByEan({ ean });

  if (!product) return null;

  return (
    <ProductQuickActions
      product={product}
      summary={
        <ProductSummary
          name={product.name}
          brand={product.brand}
          category={getMostFrequentCategory(product)}
          trailing={<ProductUnitPriceDetails product={product} />}
          className="px-0 @md:px-0"
        />
      }
      open={open}
      onOpenChange={(next) => !next && closeModal()}
    />
  );
}
