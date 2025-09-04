import React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  getAveragePrice,
  getMinPrice,
  getMaxPrice,
} from "@/lib/cijene-api/utils";
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
        <div className="flex items-center gap-4 flex-1">
          {/* Placeholder Image */}
          <div className="size-16 bg-gray-100 shadow-sm rounded-lg flex items-center justify-center shrink-0">
            <span className="text-gray-400 text-sm">IMG</span>
          </div>

          {/* Product Name and Category */}
          <div className="">
            <h3 className="font-semibold">
              {product.name || "Unknown Product"}
            </h3>
            {category && <p className="text-sm text-gray-500">{category}</p>}
          </div>
        </div>

        {/* Right side - Eye button */}
        <Button
          size="icon"
          className="size-12 shrink-0"
          onClick={() => {
            // TODO: Implement functionality
          }}
        >
          <Eye className="size-6" />
        </Button>
      </div>

      {/* Information Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* First Row - Proizvođač */}
        <div className="border-b text-sm p-2">
          <span className="font-bold">Proizvođač: </span>
          {product.brand || "Nepoznato"}
        </div>

        {/* Second Row - Bar kod */}
        <div className="border-b text-sm p-2">
          <span className="font-bold">Bar kod: </span>
          {product.ean || "Nepoznato"}
        </div>

        {/* Third Row - Split row */}
        <div className="flex items-center">
          {/* Left half - Količina */}
          <div className="border-r text-sm p-2">
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
                <span className="text-green-700">{minPrice.toFixed(2)}€</span>
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
      </div>
    </div>
  );
}
