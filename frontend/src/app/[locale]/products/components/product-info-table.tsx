"use client";

import type { ReactNode } from "react";
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

  const unknown = t("productInfo.unknown");

  function perUnit(price: number) {
    return t("productInfo.perUnit", {
      price: formatPrice(price, locale),
      unit: product.unit ?? "",
    });
  }

  const tags = {
    low: (chunks: ReactNode) => (
      <span className="text-green-700">{chunks}</span>
    ),
    mid: (chunks: ReactNode) => <span className="text-gray-700">{chunks}</span>,
    high: (chunks: ReactNode) => <span className="text-red-700">{chunks}</span>,
  };

  const priceRange =
    minPrice !== null && maxPrice !== null
      ? t.rich("productInfo.priceRange", {
          lowPrice: formatPrice(minPrice, locale),
          averagePrice:
            averagePrice !== null ? formatPrice(averagePrice, locale) : "",
          highPrice: formatPrice(maxPrice, locale),
          ...tags,
        })
      : null;

  const unitPriceRange =
    minPricePerUnit !== undefined && maxPricePerUnit !== undefined
      ? t.rich("productInfo.priceRange", {
          lowPrice: perUnit(minPricePerUnit),
          averagePrice:
            averagePricePerUnit !== undefined
              ? perUnit(averagePricePerUnit)
              : "",
          highPrice: perUnit(maxPricePerUnit),
          ...tags,
        })
      : null;

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
                {minPrice !== null && maxPrice !== null ? (
                  minPrice === maxPrice ? (
                    <span className="whitespace-nowrap text-gray-700">
                      {formatPrice(minPrice, locale)}
                    </span>
                  ) : (
                    <span className="whitespace-nowrap">{priceRange}</span>
                  )
                ) : (
                  unknown
                )}
              </td>
            </tr>
          )}

          {product.chains.length > 0 && product.quantity && (
            <tr className="flex flex-col sm:table-row">
              <td className="p-2 flex-1">
                <span className="font-bold">{t("productInfo.unitPrices")}</span>{" "}
                {minPricePerUnit !== undefined &&
                maxPricePerUnit !== undefined ? (
                  minPricePerUnit === maxPricePerUnit ? (
                    <span className="whitespace-nowrap text-gray-700">
                      {perUnit(minPricePerUnit)}
                    </span>
                  ) : (
                    <span className="whitespace-nowrap">{unitPriceRange}</span>
                  )
                ) : (
                  unknown
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
