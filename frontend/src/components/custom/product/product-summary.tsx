"use client";

import { type ComponentProps, type ReactNode } from "react";
import Image from "next/image";

import ProductInfo from "@/components/custom/product/product-info";
import { cn } from "@/lib/utils";

/**
 * Shared with product-summary-skeleton so the two cannot drift apart. A row and
 * its placeholder having identical geometry is the whole reason nothing shifts.
 */
export const PRODUCT_SUMMARY_ROW_CLASSES =
  "flex flex-col justify-between gap-3 px-3 py-2 @min-[300px]:flex-row @min-[300px]:items-center @md:gap-4 @md:px-6 @md:py-4";

export const PRODUCT_SUMMARY_IMAGE_CLASSES =
  "hidden @md:block size-16 @lg:size-20 shrink-0 rounded-lg object-contain";

interface IProductSummaryProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  /** Passive details, such as prices, shown opposite the product identity */
  trailing?: ReactNode;
  actions?: ReactNode;
  /** Keeps a press on actions from reaching a card-level gesture */
  actionProps?: Pick<
    ComponentProps<"div">,
    "onClick" | "onPointerDown" | "onPointerUp"
  >;
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
  trailing,
  actions,
  actionProps,
  className,
}: IProductSummaryProps) {
  const displayName = name && quantity ? `${name} (${quantity})` : name;

  return (
    <div className="@container">
      <div className={cn(PRODUCT_SUMMARY_ROW_CLASSES, className)}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={name ?? ""}
              width={80}
              height={80}
              className={PRODUCT_SUMMARY_IMAGE_CLASSES}
            />
          )}

          <ProductInfo name={displayName} brand={brand} category={category} />
        </div>

        {(trailing || actions) && (
          <div className="flex shrink-0 items-center justify-between gap-4">
            {trailing}

            {actions && (
              <div
                className="pointer-events-none relative z-20 [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
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
