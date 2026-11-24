"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

const PRICE_RANGE_TAGS = {
  low: (chunks: ReactNode) => <span className="text-green-700">{chunks}</span>,
  mid: (chunks: ReactNode) => <span className="text-gray-700">{chunks}</span>,
  high: (chunks: ReactNode) => <span className="text-red-700">{chunks}</span>,
};

interface IProductInfoPriceValueProps {
  min: number | null | undefined;
  max: number | null | undefined;
  average: number | null | undefined;
  format: (value: number) => string;
}

export default function ProductInfoPriceValue({
  min,
  max,
  average,
  format,
}: IProductInfoPriceValueProps) {
  const t = useTranslations("products");

  if (min == null || max == null) return t("productInfo.unknown");

  if (min === max) {
    return (
      <span className="whitespace-nowrap text-gray-700">{format(min)}</span>
    );
  }

  const priceRange = t.rich("productInfo.priceRange", {
    lowPrice: format(min),
    averagePrice: average != null ? format(average) : "",
    highPrice: format(max),
    ...PRICE_RANGE_TAGS,
  });

  return <span className="whitespace-nowrap">{priceRange}</span>;
}
