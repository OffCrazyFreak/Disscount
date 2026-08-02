"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { ProductPriceScope } from "@/app/products/typings/product-list-price";

interface IProductPriceScopeInfoProps {
  scope: ProductPriceScope;
}

const SCOPE_TEXT: Record<ProductPriceScope, string> = {
  all: "Raspon objavljenih cijena u svim trgovinama.",
  chains: "Raspon objavljenih cijena u odabranim trgovinama.",
  locations: "Raspon objavljenih cijena u odabranim trgovinama i lokacijama.",
};

function InfoButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Informacije o rasponu cijena"
      title="Informacije o rasponu cijena"
      className="size-7 text-gray-500 hover:text-gray-700 [&_svg]:size-4"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <Info aria-hidden="true" />
    </Button>
  );
}

export default function ProductPriceScopeInfo({
  scope,
}: IProductPriceScopeInfoProps) {
  const text = SCOPE_TEXT[scope];

  return (
    <>
      <span className="hidden [@media(hover:hover)]:inline-flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoButton />
          </TooltipTrigger>
          <TooltipContent variant="neutral" side="top" className="max-w-64">
            {text}
          </TooltipContent>
        </Tooltip>
      </span>

      <span className="relative z-20 inline-flex [@media(hover:hover)]:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <InfoButton />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto max-w-64 px-3 py-2">
            <p className="text-sm">{text}</p>
          </PopoverContent>
        </Popover>
      </span>
    </>
  );
}
