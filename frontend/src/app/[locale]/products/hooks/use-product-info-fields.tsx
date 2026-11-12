import { type ReactNode } from "react";
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

export interface IProductInfoField {
  label: string;
  value: ReactNode;
}

interface IProductInfoFields {
  brand: IProductInfoField;
  barcode: IProductInfoField;
  /** Prices only make sense against a quantity, so the three come and go together. */
  quantity: IProductInfoField | null;
  prices: IProductInfoField | null;
  unitPrices: IProductInfoField | null;
}

export function useProductInfoFields(
  product: ProductResponse,
): IProductInfoFields {
  const t = useTranslations("products");
  const locale = useLocale();

  const hasQuantity = Boolean(product.quantity && product.unit);

  function perUnit(price: number) {
    return t("productInfo.perUnit", {
      price: formatPrice(price, locale),
      unit: product.unit ?? "",
    });
  }

  return {
    brand: {
      label: t("productInfo.brand"),
      value: product.brand ? (
        <span lang="hr">{product.brand}</span>
      ) : (
        t("productInfo.unknown")
      ),
    },
    barcode: {
      label: t("productInfo.barcode"),
      value: product.ean || t("productInfo.unknown"),
    },
    quantity: hasQuantity
      ? {
          label: t("productInfo.quantity"),
          value: `${formatQuantity(product.quantity ?? "")} ${product.unit}`,
        }
      : null,
    prices: hasQuantity
      ? {
          label: t("productInfo.prices"),
          value: (
            <ProductInfoPriceValue
              min={getMinPrice(product)}
              max={getMaxPrice(product)}
              average={getAveragePrice(product)}
              format={(price) => formatPrice(price, locale)}
            />
          ),
        }
      : null,
    unitPrices:
      product.chains.length > 0 && product.quantity
        ? {
            label: t("productInfo.unitPrices"),
            value: (
              <ProductInfoPriceValue
                min={getMinPricePerUnit(product)}
                max={getMaxPricePerUnit(product)}
                average={getAveragePricePerUnit(product)}
                format={perUnit}
              />
            ),
          }
        : null,
  };
}
