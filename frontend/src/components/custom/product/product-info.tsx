"use client";

import { memo } from "react";

import StretchedLink from "@/components/custom/common/stretched-link";

interface IProductInfoProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  /** When set, the name carries the surrounding card's link. */
  href?: string;
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
}

/**
 * The name is the link rather than an anchor laid over the card, so it stays
 * drag selectable: text inside an anchor selects natively while a click still
 * navigates. Category and brand sit outside that anchor, so they need to be
 * raised above its stretched pseudo-element to stay selectable too. Neither this
 * root nor the heading may be positioned, or the stretch would resolve against
 * them instead of the card.
 */
const ProductInfo = memo(function ProductInfo({
  name,
  brand,
  category,
  href,
  onNavigate,
}: IProductInfoProps) {
  const label = name || "Nepoznat proizvod";

  return (
    <div className="min-w-0 flex-1">
      {category && (
        <div className="relative z-10 w-fit text-xs @md:text-sm text-gray-500">
          {category}
        </div>
      )}

      <h3 className="font-bold text-sm @md:text-base text-pretty">
        {href ? (
          <StretchedLink href={href} onNavigate={onNavigate}>
            {label}
          </StretchedLink>
        ) : (
          label
        )}
      </h3>

      {brand && (
        <div className="relative z-10 w-fit text-xs @md:text-sm">{brand}</div>
      )}
    </div>
  );
});

export default ProductInfo;
