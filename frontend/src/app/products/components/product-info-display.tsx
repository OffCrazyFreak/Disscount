import { useMemo } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import ProductInfoTable from "@/app/products/components/product-info-table";

interface IProductInfoDisplayProps {
  product: ProductResponse;
  enableActionButtons?: boolean;
}

export default function ProductInfoDisplay({
  product,
  enableActionButtons = true,
}: IProductInfoDisplayProps) {
  // Get the most common category from chains (similar to ProductCard logic)
  const category = useMemo(() => {
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
          {/* TODO: Product Image */}
          {/* <div className="hidden sm:grid place-items-center size-16 bg-gray-100 shadow-sm rounded-lg">
            <span className="text-gray-400 text-sm">IMG</span>
          </div> */}

          {/* Product Name and Category */}
          <div className="text-pretty">
            <h3 className="font-bold">{product.name || "Nepoznato"}</h3>
            {category && <p className="text-sm text-gray-500">{category}</p>}
          </div>
        </div>

        {/* Right side - Action buttons */}
        {enableActionButtons && (
          <ProductActionButtons
            product={product}
            showSearchImage={true}
            showAddToList={true}
            showAddToWatchList={true}
          />
        )}
      </div>

      <ProductInfoTable product={product} />
    </div>
  );
}
