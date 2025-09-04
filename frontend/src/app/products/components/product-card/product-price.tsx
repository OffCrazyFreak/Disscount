import { memo } from "react";
import { Separator } from "@/components/ui/separator";
import { formatQuantity } from "@/utils/strings";
import {
  getMinPrice,
  getAveragePrice,
  getMaxPrice,
} from "@/lib/cijene-api/utils";
import { ProductResponse } from "@/lib/cijene-api/schemas";

interface ProductPriceProps {
  product: ProductResponse;
}

export const ProductPrice = memo(({ product }: ProductPriceProps) => {
  const minPrice = getMinPrice(product);
  const maxPrice = getMaxPrice(product);
  const averagePrice = getAveragePrice(product);

  return (
    <div className="text-sm sm:text-md flex items-center justify-center flex-col sm:flex-row gap-2">
      {product.quantity && product.unit && (
        <div className="flex gap-2">
          {formatQuantity(product.quantity) + "" + product.unit}
          <span className="text-gray-700 hidden sm:inline">~</span>
        </div>
      )}

      {minPrice !== undefined ? (
        <div className="font-bold text-md text-center">
          <div className="text-sm sm:text-md flex items-center gap-1 ">
            <span className="text-green-700">{minPrice.toFixed(2)}€</span>
            <span className="text-gray-700"> - </span>
            <span className="text-red-700">{maxPrice.toFixed(2)}€</span>
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
});
