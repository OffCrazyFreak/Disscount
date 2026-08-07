"use client";

import { type ComponentProps, type ReactNode } from "react";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";
import ProductInfo from "@/components/custom/product/product-info";
import { cn } from "@/lib/utils";

interface IProductSummaryProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  isLoading?: boolean;
  /** Passive details, such as prices, shown opposite the product identity */
  trailing?: ReactNode;
  actions?: ReactNode;
  /**
   * Applied to the actions wrapper, so a surface that hides its actions hides
   * the element the row's gap is measured against too.
   */
  actionsClassName?: string;
  /** Keeps a press on actions from reaching a card-level gesture */
  actionProps?: Pick<
    ComponentProps<"div">,
    "onClick" | "onPointerDown" | "onPointerUp"
  >;
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
  trailing,
  actions,
  actionsClassName,
  actionProps,
  href,
  onNavigate,
  className,
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

        {(trailing || actions) && (
          <div className="flex shrink-0 items-center justify-between gap-4">
            {/* Raised above the name link's stretched pseudo-element so prices
                stay selectable; actions go a layer higher again so they keep
                receiving pointer events without opting in class by class. */}
            {trailing && <div className="relative z-10">{trailing}</div>}

            {actions && (
              <div
                className={cn("relative z-20", actionsClassName)}
                {...actionProps}
              >
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
