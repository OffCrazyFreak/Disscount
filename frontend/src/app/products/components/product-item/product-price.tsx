import { memo } from "react";
import { Separator } from "@/components/ui/separator";
import { formatQuantity } from "@/utils/strings";
import {
  getMinPrice,
  getMaxPrice,
  getMinPricePerUnit,
  getMaxPricePerUnit,
} from "@/app/products/utils/product-utils";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import type { IProductListPrice } from "@/app/products/typings/product-list-price-types";
import ProductPriceScopeInfo from "@/app/products/components/product-item/product-price-scope-info";

interface IProductUnitPriceDetailsProps {
  product: ProductResponse;
  /** List-only override. Omit outside a filtered product card. */
  price?: IProductListPrice | null;
}

const ProductUnitPriceDetails = memo(
  ({ product, price }: IProductUnitPriceDetailsProps) => {
    const minPrice =
      price === undefined ? getMinPrice(product) : (price?.minPrice ?? null);
    const maxPrice =
      price === undefined ? getMaxPrice(product) : (price?.maxPrice ?? null);

    const quantity = Number(product.quantity);
    const canCalculateUnitPrice = Number.isFinite(quantity) && quantity > 0;
    const minPricePerUnit =
      price === undefined
        ? getMinPricePerUnit(product)
        : minPrice !== null && canCalculateUnitPrice
          ? minPrice / quantity
          : undefined;
    const maxPricePerUnit =
      price === undefined
        ? getMaxPricePerUnit(product)
        : maxPrice !== null && canCalculateUnitPrice
          ? maxPrice / quantity
          : undefined;

    return (
      <div>
        <div className="text-sm sm:text-md flex items-center justify-center flex-col sm:flex-row gap-2">
          {product.quantity && product.unit && (
            <div className="flex gap-2">
              {formatQuantity(product.quantity) + " " + product.unit}
              <span className="text-gray-700 hidden sm:inline">~</span>
            </div>
          )}

          {minPrice != null && maxPrice != null ? (
            <div className="font-bold text-md text-center">
              <div className="text-sm sm:text-md flex items-center gap-1">
                {minPrice === maxPrice ? (
                  <span className="text-gray-700">{minPrice.toFixed(2)}€</span>
                ) : (
                  <>
                    <span className="text-green-700">
                      {minPrice.toFixed(2)}€
                    </span>
                    <span className="text-gray-700"> - </span>
                    <span className="text-red-700">{maxPrice.toFixed(2)}€</span>
                  </>
                )}

                {price && <ProductPriceScopeInfo scope={price.scope} />}
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

        {minPricePerUnit !== undefined &&
          maxPricePerUnit !== undefined &&
          product.unit && (
            <>
              <Separator className="px-10 mb-1" />

              <div className="text-sm sm:text-md flex items-center justify-center gap-1">
                {minPricePerUnit === maxPricePerUnit ? (
                  <span className="text-gray-700">
                    {`${minPricePerUnit.toFixed(2)}€/${product.unit}`}
                  </span>
                ) : (
                  <>
                    <span className="text-green-700">
                      {`${minPricePerUnit.toFixed(2)}€/${product.unit}`}
                    </span>
                    <span className="text-gray-700"> - </span>
                    <span className="text-red-700">
                      {`${maxPricePerUnit.toFixed(2)}€/${product.unit}`}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
      </div>
    );
  },
);

ProductUnitPriceDetails.displayName = "ProductPrice";

export default ProductUnitPriceDetails;
