"use client";

import { TriangleAlert } from "lucide-react";
import cijeneService from "@/lib/cijene-api";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import useFilteredProductPrices from "@/app/products/hooks/use-filtered-product-prices";
import useProductFilters from "@/app/products/hooks/use-product-filters";
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
              title="Cijene nisu dostupne"
              text="Radnje za proizvod i dalje možeš koristiti. Pokušaj ponovo za aktualni raspon cijena."
            />
          )}

          {!isLoading && !priceError && hasPartialError && (
            <Banner
              role="status"
              variant="warningSoft"
              icon={TriangleAlert}
              title="Neke cijene nisu dostupne"
              text="Raspon uključuje lokacije čije smo cijene uspjeli dohvatiti."
            />
          )}
        </>
      }
      open={open}
      onOpenChange={(next) => !next && closeModalUrl()}
    />
  );
}
