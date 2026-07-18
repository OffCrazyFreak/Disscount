import { useMemo, type ReactNode } from "react";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import ProductActionButtons from "@/app/products/components/product-action-buttons";
import ProductInfoTable from "@/app/products/components/product-info-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface IProductInfoDisplayProps {
  product: ProductResponse;
  enableActionButtons?: boolean;
  // Rendered on the right of the name row (e.g. a remove button inside modals).
  action?: ReactNode;
}

export default function ProductInfoDisplay({
  product,
  enableActionButtons = true,
  action,
}: IProductInfoDisplayProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

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
          {/* Back button only on the standalone product page, not inside modals */}
          {enableActionButtons && (
            <Button variant="ghost" size="icon" onClick={handleBackClick}>
              <ChevronLeft className="size-6 sm:size-7" />
            </Button>
          )}

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

        {/* Right side - action buttons on the product page, or a modal action */}
        {enableActionButtons ? (
          <ProductActionButtons
            product={product}
            showSearchImage={true}
            showAddToList={true}
            showAddToWatchlist={true}
          />
        ) : (
          action
        )}
      </div>

      <ProductInfoTable product={product} />
    </div>
  );
}
