import { useLocale, useTranslations } from "next-intl";
import PriceStack from "@/components/custom/price/price-stack";
import { formatQuantity } from "@/utils/strings";
import { formatPrice } from "@/utils/price";
import {
  getMinPrice,
  getMaxPrice,
  getMinPricePerUnit,
  getMaxPricePerUnit,
  getPricePerUnit,
} from "@/app/[locale]/products/utils/product-utils";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import type { IProductListPrice } from "@/app/[locale]/products/typings/product-list-price-types";
import ProductPriceScopeInfo from "@/app/[locale]/products/components/product-item/product-price-scope-info";

interface IProductUnitPriceDetailsProps {
  product: ProductResponse;
  /** List-only override. Omit outside a filtered product card. */
  price?: IProductListPrice | null;
}

export default function ProductUnitPriceDetails({
  product,
  price,
}: IProductUnitPriceDetailsProps) {
  const t = useTranslations("products");
  const locale = useLocale();
  const minPrice =
    price === undefined ? getMinPrice(product) : (price?.minPrice ?? null);
  const maxPrice =
    price === undefined ? getMaxPrice(product) : (price?.maxPrice ?? null);

  const quantity = Number(product.quantity);
  const minPricePerUnit =
    price === undefined
      ? getMinPricePerUnit(product)
      : getPricePerUnit(minPrice, quantity);
  const maxPricePerUnit =
    price === undefined
      ? getMaxPricePerUnit(product)
      : getPricePerUnit(maxPrice, quantity);

  const hasUnitPrices =
    minPricePerUnit !== undefined &&
    maxPricePerUnit !== undefined &&
    !!product.unit;

  function perUnit(value: number) {
    return t("productInfo.perUnit", {
      price: formatPrice(value, locale),
      unit: product.unit ?? "",
    });
  }

  return (
    <PriceStack
      primaryClassName="max-sm:flex-col"
      primary={
        <>
          {product.quantity && product.unit && (
            <span className="flex items-center gap-2">
              {formatQuantity(product.quantity) + " " + product.unit}
              <span className="text-gray-700 hidden sm:inline">~</span>
            </span>
          )}

          {minPrice != null && maxPrice != null ? (
            // Groups the figures with their info button, so the icon cannot drop
            // to a line of its own where the tier stacks on a narrow card.
            <span className="flex items-center gap-2">
              {/* Tighter than the group's gap, since the dash already spaces the
                  two figures. */}
              <span className="flex items-center gap-1 font-bold">
                {minPrice === maxPrice ? (
                  <span className="text-gray-700">
                    {formatPrice(minPrice, locale)}
                  </span>
                ) : (
                  <>
                    <span className="text-green-700">
                      {formatPrice(minPrice, locale)}
                    </span>
                    <span className="text-gray-700"> - </span>
                    <span className="text-red-700">
                      {formatPrice(maxPrice, locale)}
                    </span>
                  </>
                )}
              </span>

              {/* A single figure is not a range, so there is no scope to explain.
                  One store always reports the same min and max. */}
              {price && minPrice !== maxPrice && (
                <ProductPriceScopeInfo scope={price.scope} />
              )}
            </span>
          ) : (
            <span className="text-gray-500">{t("productPrice.unknown")}</span>
          )}
        </>
      }
      secondary={
        hasUnitPrices &&
        (minPricePerUnit === maxPricePerUnit ? (
          <span className="text-gray-700">{perUnit(minPricePerUnit)}</span>
        ) : (
          <>
            <span className="text-green-700">{perUnit(minPricePerUnit)}</span>
            <span className="text-gray-700"> - </span>
            <span className="text-red-700">{perUnit(maxPricePerUnit)}</span>
          </>
        ))
      }
    />
  );
}
