"use client";

import MediaRow from "@/components/custom/common/media-row";
import ProductThumbnail from "@/components/custom/product-photos/product-thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import ProductInfo from "@/components/custom/product/product-info";
import ProductSummaryAside, {
  type IProductSummaryAsideProps,
} from "@/components/custom/product/product-summary-aside";
import { cn } from "@/lib/utils";

interface IProductSummaryProps extends IProductSummaryAsideProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  quantity?: string | null;
  /** When set, the row shows the product's photo, or the placeholder without one. */
  ean?: string;
  isLoading?: boolean;
  /** When set, the product name carries the card's link. */
  href?: string;
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
  className?: string;
}

/**
 * How a product reads wherever it is listed: its identity on the left, whatever
 * the surface cares about on the right. The container is a wrapper rather than
 * the row, since an element cannot answer a query it establishes itself.
 */
export default function ProductSummary({
  name,
  brand,
  category,
  quantity,
  ean,
  isLoading = false,
  href,
  onNavigate,
  className,
  ...aside
}: IProductSummaryProps) {
  const displayName = name && quantity ? `${name} (${quantity})` : name;

  return (
    <div className="@container">
      <MediaRow
        // Even padding, so the photo sits as far from the card's edges as from its top and bottom.
        className={cn("p-3 @md:p-4", className)}
        media={
          ean !== undefined && (
            <ProductThumbnail
              ean={ean}
              // Only a row that links to its product opens the viewer: inside a modal sheet the
              // lightbox would sit outside the dialog's focus trap and pointer lock.
              productName={href ? (name ?? undefined) : undefined}
            />
          )
        }
      >
        <div className="flex min-w-0 flex-col justify-between gap-3 @min-[300px]:flex-row @min-[300px]:items-center @md:gap-4">
          {isLoading ? (
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center">
              <ProductInfo
                name={displayName}
                brand={brand}
                category={category}
                href={href}
                onNavigate={onNavigate}
              />
            </div>
          )}

          <ProductSummaryAside {...aside} />
        </div>
      </MediaRow>
    </div>
  );
}
