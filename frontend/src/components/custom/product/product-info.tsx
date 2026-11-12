"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

import StretchedLink from "@/components/custom/common/stretched-link";

interface IProductInfoProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  /** When set, the name carries the surrounding card's link. */
  href?: string;
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
}

/** The name is the link so it stays selectable; a positioned root or heading would catch the stretch. */
const ProductInfo = memo(function ProductInfo({
  name,
  brand,
  category,
  href,
  onNavigate,
}: IProductInfoProps) {
  const t = useTranslations("products");
  const label = name || t("productInfo.unknownProduct");

  return (
    <div className="min-w-0 flex-1">
      {category && (
        <div
          lang="hr"
          className="relative z-10 w-fit text-xs @md:text-sm text-gray-500"
        >
          {category}
        </div>
      )}

      <h3
        lang={name ? "hr" : undefined}
        className="font-bold text-sm @md:text-base text-pretty"
      >
        {href ? (
          <StretchedLink href={href} onNavigate={onNavigate}>
            {label}
          </StretchedLink>
        ) : (
          label
        )}
      </h3>

      {brand && (
        <div lang="hr" className="relative z-10 w-fit text-xs @md:text-sm">
          {brand}
        </div>
      )}
    </div>
  );
});

export default ProductInfo;
