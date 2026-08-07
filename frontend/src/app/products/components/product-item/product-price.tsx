import PriceStack from "@/components/custom/price/price-stack";
import { formatQuantity } from "@/utils/strings";
import {
  getMinPrice,
  getMaxPrice,
  getMinPricePerUnit,
  getMaxPricePerUnit,
  getPricePerUnit,
} from "@/app/products/utils/product-utils";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import type { IProductListPrice } from "@/app/products/typings/product-list-price-types";
import ProductPriceScopeInfo from "@/app/products/components/product-item/product-price-scope-info";

interface IProductUnitPriceDetailsProps {
  product: ProductResponse;
  /** List-only override. Omit outside a filtered product card. */
  price?: IProductListPrice | null;
}

export default function ProductUnitPriceDetails({
  product,
  price,
}: IProductUnitPriceDetailsProps) {
  const minPrice =
    price === undefined ? getMinPrice(product) : (price?.minPrice ?? null);
  const maxPrice =
    price === undefined ? getMaxPrice(product) : (price?.maxPrice ?? null);

  const quantity = Number(product.quantity);
  const minPricePerUnit =
    price === undefined
      ? getMinPricePerUnit(product)
      : getPricePerUnit(minPrice, quantity);
  const maxPricePerUnit =
    price === undefined
      ? getMaxPricePerUnit(product)
      : getPricePerUnit(maxPrice, quantity);

  const hasUnitPrices =
    minPricePerUnit !== undefined &&
    maxPricePerUnit !== undefined &&
    !!product.unit;

  return (
    <PriceStack
      primaryClassName="max-sm:flex-col"
      primary={
        <>
          {product.quantity && product.unit && (
            <span className="flex items-center gap-2">
              {formatQuantity(product.quantity) + " " + product.unit}
              <span className="text-gray-700 hidden sm:inline">~</span>
            </span>
          )}

          {minPrice != null && maxPrice != null ? (
            // Groups the figures with their info button, so the icon cannot drop
            // to a line of its own where the tier stacks on a narrow card.
            <span className="flex items-center gap-2">
              {/* Tighter than the group's gap, since the dash already spaces the
                  two figures. */}
              <span className="flex items-center gap-1 font-bold">
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
              </span>

              {/* A single figure is not a range, so there is no scope to explain.
                  One store always reports the same min and max. */}
              {price && minPrice !== maxPrice && (
                <ProductPriceScopeInfo scope={price.scope} />
              )}
            </span>
          ) : (
            <span className="text-gray-500">Nepoznata cijena</span>
          )}
        </>
      }
      secondary={
        hasUnitPrices &&
        (minPricePerUnit === maxPricePerUnit ? (
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
        ))
      }
    />
  );
}
