"use client";

import { useTranslations } from "next-intl";
import PriceInfoButton from "@/components/custom/price/price-info-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ProductPriceScope } from "@/app/[locale]/products/typings/product-list-price-types";
import { useFinePointer } from "@/hooks/use-fine-pointer";

interface IProductPriceScopeInfoProps {
  scope: ProductPriceScope;
}

const SCOPE_TEXT_KEYS = {
  all: "priceScope.all",
  chains: "priceScope.chains",
  locations: "priceScope.locations",
} as const satisfies Record<ProductPriceScope, string>;

function stopPropagation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export default function ProductPriceScopeInfo({
  scope,
}: IProductPriceScopeInfoProps) {
  const t = useTranslations("products");
  const hasFinePointer = useFinePointer();
  const text = t(SCOPE_TEXT_KEYS[scope]);
  const trigger = (
    <PriceInfoButton
      label={t("priceScope.label")}
      className="text-gray-700 hover:text-gray-900"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerUp={stopPropagation}
    />
  );

  return hasFinePointer ? (
    <span className="relative z-20 inline-flex">
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent variant="neutral" side="top" className="max-w-64">
          {text}
        </TooltipContent>
      </Tooltip>
    </span>
  ) : (
    <span className="relative z-20 inline-flex">
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="end" className="w-auto max-w-64 px-3 py-2">
          <p className="text-sm">{text}</p>
        </PopoverContent>
      </Popover>
    </span>
  );
}
