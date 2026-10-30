"use client";

import { useLocale, useTranslations } from "next-intl";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getMinPrice,
  getMaxPrice,
  getMinPricePerUnit,
  getMaxPricePerUnit,
  getAveragePricePerUnit,
} from "@/app/[locale]/products/utils/product-utils";
import { formatQuantity } from "@/utils/strings";
import { formatPrice } from "@/utils/price";
import ProductInfoPriceValue from "@/app/[locale]/products/components/product-info-price-value";

interface IProductInfoTableProps {
  product: ProductResponse;
}

export default function ProductInfoTable({ product }: IProductInfoTableProps) {
  const t = useTranslations("products");
  const locale = useLocale();

  const averagePrice = getAveragePrice(product);
  const minPrice = getMinPrice(product);
  const maxPrice = getMaxPrice(product);

  const minPricePerUnit = getMinPricePerUnit(product);
  const maxPricePerUnit = getMaxPricePerUnit(product);
  const averagePricePerUnit = getAveragePricePerUnit(product);

  function formatAmount(price: number) {
    return formatPrice(price, locale);
  }

  function perUnit(price: number) {
    return t("productInfo.perUnit", {
      price: formatPrice(price, locale),
      unit: product.unit ?? "",
    });
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs">
      <table className="w-full text-sm table-fixed">
        <tbody>
          <tr className="flex flex-col sm:table-row">
            <td className="p-2 border-b sm:border-b-0 sm:border-r flex-1">
              <span className="font-bold">{t("productInfo.brand")}</span>{" "}
              {product.brand ? (
                <span lang="hr">{product.brand}</span>
              ) : (
                t("productInfo.unknown")
              )}
            </td>
            <td className="p-2 flex-1">
              <span className="font-bold">{t("productInfo.barcode")}</span>{" "}
              {product.ean || t("productInfo.unknown")}
            </td>
          </tr>

          {product.quantity && product.unit && (
            <tr className="flex flex-col sm:table-row border-y">
              <td className="p-2 border-b sm:border-b-0 sm:border-r flex-1">
                <span className="font-bold">{t("productInfo.quantity")}</span>{" "}
                {`${formatQuantity(product.quantity)} ${product.unit}`}
              </td>
              <td className="p-2 flex-1">
                <span className="font-bold">{t("productInfo.prices")}</span>{" "}
                <ProductInfoPriceValue
                  min={minPrice}
                  max={maxPrice}
                  average={averagePrice}
                  format={formatAmount}
                />
              </td>
            </tr>
          )}

          {product.chains.length > 0 && product.quantity && (
            <tr className="flex flex-col sm:table-row">
              <td className="p-2 flex-1">
                <span className="font-bold">{t("productInfo.unitPrices")}</span>{" "}
                <ProductInfoPriceValue
                  min={minPricePerUnit}
                  max={maxPricePerUnit}
                  average={averagePricePerUnit}
                  format={perUnit}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
