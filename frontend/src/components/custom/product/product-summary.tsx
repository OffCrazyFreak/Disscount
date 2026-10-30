"use client";

import Image from "next/image";

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
  imageUrl?: string | null;
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
  imageUrl,
  isLoading = false,
  href,
  onNavigate,
  className,
  ...aside
}: IProductSummaryProps) {
  const displayName = name && quantity ? `${name} (${quantity})` : name;

  return (
    <div className="@container">
      <div
        className={cn(
          "flex flex-col justify-between gap-3 px-3 py-2 @min-[300px]:flex-row @min-[300px]:items-center @md:gap-4 @md:px-4 @md:py-3",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={name ?? ""}
              width={80}
              height={80}
              className="hidden @md:block size-16 shrink-0 rounded-lg object-contain"
            />
          )}

          {isLoading ? (
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ) : (
            <ProductInfo
              name={displayName}
              brand={brand}
              category={category}
              href={href}
              onNavigate={onNavigate}
            />
          )}
        </div>

        <ProductSummaryAside {...aside} />
      </div>
    </div>
  );
}
