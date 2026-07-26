"use client";

import { type MouseEvent, type ReactNode } from "react";
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
  /** Prices, actions, or whatever the surface puts opposite the name */
  trailing?: ReactNode;
  /** Keeps a press on the trailing controls from reaching a clickable card */
  onTrailingClick?: (event: MouseEvent) => void;
  className?: string;
}

/**
 * How a product reads wherever it is listed: its identity on the left, whatever
 * the surface cares about on the right. Its own container, so the row can be
 * dropped into a card, a sheet or a modal and still lay itself out.
 */
export default function ProductSummary({
  name,
  brand,
  category,
  quantity,
  imageUrl,
  isLoading = false,
  trailing,
  onTrailingClick,
  className,
}: IProductSummaryProps) {
  const displayName = name && quantity ? `${name} (${quantity})` : name;

  return (
    <div
      className={cn(
        "@container flex flex-col justify-between gap-3 px-3 py-2 @min-[320px]:flex-row @min-[320px]:items-center @md:gap-4 @md:px-6 @md:py-4",
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
            className="hidden @md:block size-16 @lg:size-20 shrink-0 rounded-lg object-contain"
          />
        )}

        {isLoading ? (
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ) : (
          <ProductInfo name={displayName} brand={brand} category={category} />
        )}
      </div>

      {trailing && (
        <div
          className="flex shrink-0 items-center justify-between gap-4"
          onClick={onTrailingClick}
        >
          {trailing}
        </div>
      )}
    </div>
  );
}
