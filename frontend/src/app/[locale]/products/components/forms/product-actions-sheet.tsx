"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import cijeneService from "@/lib/cijene-api";
import { getMostFrequentCategory } from "@/app/[locale]/products/utils/product-utils";
import ProductUnitPriceDetails from "@/app/[locale]/products/components/product-item/product-price";
import useFilteredProductPrices from "@/app/[locale]/products/hooks/use-filtered-product-prices";
import useProductFilters from "@/app/[locale]/products/hooks/use-product-filters";
import ProductQuickActions from "@/components/custom/product/product-quick-actions";
import ProductSummary from "@/components/custom/product/product-summary";
import { Banner } from "@/components/custom/common/banner";
import { closeModalUrl } from "@/lib/modal/modal-navigation";

interface IProductActionsSheetProps {
  open: boolean;
  ean: string;
}

/**
 * Resolves the product a shared link names and lends the sheet the price
 * display, which belongs to this feature rather than to the shared sheet. The
 * opener seeds the by-ean cache, so only a cold link actually fetches.
 */
export default function ProductActionsSheet({
  open,
  ean,
}: IProductActionsSheetProps) {
  const t = useTranslations("products");
  const {
    selectedLocations,
    selectedSourceCities,
    allowedChains,
    locationsReady,
    locationsError,
  } = useProductFilters({ seedPreferred: false });
  const { data: product, isLoading: productLoading } =
    cijeneService.useGetProductByEan({ ean });
  const {
    items,
    isLoading: pricesLoading,
    error: pricesError,
    hasPartialError,
  } = useFilteredProductPrices({
    products: product ? [product] : [],
    allowedChains,
    selectedLocations,
    selectedSourceCities,
  });

  const price = items.find((item) => item.product.ean === ean)?.price ?? null;
  const isLoading =
    productLoading ||
    pricesLoading ||
    (selectedLocations.length > 0 && !locationsReady);
  const priceError = locationsError || pricesError;

  return (
    <ProductQuickActions
      product={product}
      isLoading={isLoading}
      summary={
        <>
          <ProductSummary
            name={product?.name ?? null}
            brand={product?.brand}
            category={product ? getMostFrequentCategory(product) : null}
            isLoading={isLoading}
            trailing={
              product && !isLoading ? (
                <ProductUnitPriceDetails product={product} price={price} />
              ) : undefined
            }
            className="px-0 @md:px-0"
          />

          {!isLoading && priceError && (
            <Banner
              role="status"
              variant="destructiveSoft"
              icon={TriangleAlert}
              title={t("actionsSheet.pricesUnavailableTitle")}
              text={t("actionsSheet.pricesUnavailableText")}
            />
          )}

          {!isLoading && !priceError && hasPartialError && (
            <Banner
              role="status"
              variant="warningSoft"
              icon={TriangleAlert}
              title={t("actionsSheet.partialPricesTitle")}
              text={t("actionsSheet.partialPricesText")}
            />
          )}
        </>
      }
      open={open}
      onOpenChange={(next) => !next && closeModalUrl()}
    />
  );
}
