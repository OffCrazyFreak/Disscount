import { useRouter } from "@/i18n/navigation";
import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMostFrequentCategory } from "@/app/[locale]/products/utils/product-utils";
import ProductActionButtons from "@/app/[locale]/products/components/product-action-buttons";
import ProductInfoTable from "@/app/[locale]/products/components/product-info-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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
  const t = useTranslations("products");
  const router = useRouter();

  function handleBackClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const category = getMostFrequentCategory(product);

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Image and product info */}
        <div className="flex-1 flex items-center gap-4">
          {/* Back button only on the standalone product page, not inside modals */}
          {enableActionButtons && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("productInfo.back")}
              onClick={handleBackClick}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
          )}

          {/* TODO: Product Image */}
          {/* <div className="hidden sm:grid place-items-center size-16 bg-gray-100 shadow-sm rounded-lg">
            <span className="text-gray-400 text-sm">IMG</span>
          </div> */}

          {/* Product Name and Category */}
          <div className="text-pretty">
            <h3 lang={product.name ? "hr" : undefined} className="font-bold">
              {product.name || t("productInfo.unknown")}
            </h3>
            {category && (
              <p lang="hr" className="text-sm text-gray-500">
                {category}
              </p>
            )}
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
