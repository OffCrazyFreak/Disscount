import React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getMinPrice,
  getMaxPrice,
  getMinPricePerUnit,
  getMaxPricePerUnit,
  getAveragePricePerUnit,
} from "@/lib/cijene-api/utils/product-utils";
import { formatQuantity } from "@/utils/strings";

interface ProductInfoDisplayProps {
  product: ProductResponse;
}

export default function ProductInfoDisplay({
  product,
}: ProductInfoDisplayProps) {
  const averagePrice = getAveragePrice(product);
  const minPrice = getMinPrice(product);
  const maxPrice = getMaxPrice(product);

  const minPricePerUnit = getMinPricePerUnit(product);
  const maxPricePerUnit = getMaxPricePerUnit(product);
  const averagePricePerUnit = getAveragePricePerUnit(product);

  // Get the most common category from chains (similar to ProductCard logic)
  const category = React.useMemo(() => {
    if (!product.chains || product.chains.length === 0) return null;

    const categoryCount: Record<string, number> = {};

    product.chains.forEach((chain) => {
      if (chain.category) {
        categoryCount[chain.category] =
          (categoryCount[chain.category] || 0) + 1;
      }
    });

    let mostFrequentCategory = null;
    let maxCount = 0;

    for (const [cat, count] of Object.entries(categoryCount)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentCategory = cat;
      }
    }

    return mostFrequentCategory;
  }, [product.chains]);

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Image and product info */}
        <div className="flex-1 flex items-center gap-4">
          {/* Placeholder Image */}
          <div className="hidden sm:grid place-items-center size-16 bg-gray-100 shadow-sm rounded-lg">
            <span className="text-gray-400 text-sm">IMG</span>
          </div>

          {/* Product Name and Category */}
          <div className="text-pretty">
            <h3 className="font-bold">{product.name || "Nepoznato"}</h3>
            {category && <p className="text-sm text-gray-500">{category}</p>}
          </div>
        </div>

        {/* Right side - Eye button */}
        <Button
          size="icon"
          className="size-12"
          onClick={() => {
            // TODO: Implement functionality
          }}
        >
          <Eye className="size-6" />
        </Button>
      </div>

      {/* Information Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs">
        <div className="flex flex-wrap items-center justify-between">
          <div className="grow-1">
            {/* First Row - Proizvođač */}
            <div className="text-sm p-2">
              <span className="font-bold">Proizvođač: </span>
              {product.brand || "Nepoznato"}
            </div>

            {/* Second Row - Bar kod */}
            <div className="border-y text-sm p-2">
              <span className="font-bold">Bar kod: </span>
              {product.ean || "Nepoznato"}
            </div>
          </div>

          <div className="border-l grow-1">
            {/* Third Row - Split row */}
            <div className="flex items-center">
              {/* Left half - Količina */}
              <div className="text-sm p-2">
                <span className="font-bold">Količina: </span>
                {product.quantity && product.unit
                  ? `${formatQuantity(product.quantity)}${product.unit}`
                  : "Nepoznato"}
              </div>

              {/* Right half - Prosječna cijena */}
              <div className="flex-1 border-l text-sm p-2">
                <span className="font-bold">Cijene: </span>
                {product.chains.length > 0 ? (
                  <span className="whitespace-nowrap">
                    <span className="text-green-700">
                      {minPrice.toFixed(2)}€
                    </span>
                    {/* <span className="text-gray-700">|</span> */}
                    <span className="text-gray-700">
                      {" "}
                      | {averagePrice?.toFixed(2)}€ |{" "}
                    </span>
                    {/* <span className="text-gray-700">|</span> */}
                    <span className="text-red-700">{maxPrice.toFixed(2)}€</span>
                  </span>
                ) : (
                  "Nepoznato"
                )}
              </div>
            </div>

            {/* Fourth Row - Jedinične cijene */}
            <div className="border-y text-sm p-2">
              <span className="font-bold">Jed. cijene: </span>
              {product.chains.length > 0 && product.quantity ? (
                <span className="whitespace-nowrap">
                  <span className="text-green-700">
                    {minPricePerUnit?.toFixed(2)}€/{product.unit}
                  </span>
                  {/* <span className="text-gray-700">|</span> */}
                  <span className="text-gray-700">
                    {" "}
                    | {averagePricePerUnit?.toFixed(2)}€/{product.unit} |{" "}
                  </span>
                  {/* <span className="text-gray-700">|</span> */}
                  <span className="text-red-700">
                    {maxPricePerUnit?.toFixed(2)}€/{product.unit}
                  </span>
                </span>
              ) : (
                "Nepoznato"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
