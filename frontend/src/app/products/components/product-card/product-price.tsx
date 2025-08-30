import React from "react";
import { Separator } from "@/components/ui/separator";
import { formatQuantity } from "@/lib/utils/strings";
import {
  getMinPrice,
  getAveragePrice,
  getMaxPrice,
} from "@/app/products/api/utils";
import { ProductResponse } from "@/app/products/api/schemas";

interface ProductPriceProps {
  product: ProductResponse;
}

export function ProductPrice({ product }: ProductPriceProps) {
  const minPrice = getMinPrice(product);
  const maxPrice = getMaxPrice(product);
  const averagePrice = getAveragePrice(product);

  return (
    <div
      className={`flex items-center justify-center flex-col sm:flex-row gap-2 sm:gap-4`}
    >
      {product.quantity && product.unit && (
        <div className="">
          {formatQuantity(product.quantity) + "" + product.unit}
        </div>
      )}

      <span className="text-gray-700 hidden sm:inline">~</span>

      {minPrice !== undefined && averagePrice !== undefined ? (
        <div className="font-bold text-md text-center">
          <div className="text-green-600 flex flex-wrap items-center justify-end gap-1">
            <span>{minPrice.toFixed(2)}€</span>
            <span className=""> - </span>
            <span>{maxPrice.toFixed(2)}€</span>
          </div>

          {/* <div className="text-green-600">{minPrice.toFixed(2)}€</div>
          <Separator className="px-10 mb-1" />
          <div className="text-xs text-gray-500">
            {averagePrice.toFixed(2)}€
          </div> */}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">Nepoznata cijena</div>
      )}
    </div>
  );
}
