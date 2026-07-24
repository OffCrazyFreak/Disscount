"use client";

import { MouseEvent, ReactNode } from "react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductInfo from "@/components/custom/product/product-info";
import { cn } from "@/lib/utils";

interface IProductCardProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  onClick?: () => void;
  isLoading?: boolean;
  trailing?: ReactNode;
  className?: string;
}

export default function ProductCard({
  name,
  brand,
  category,
  quantity,
  imageUrl,
  onClick,
  isLoading = false,
  trailing,
  className,
}: IProductCardProps) {
  const displayName = name && quantity ? `${name} (${quantity})` : name;

  function stopCardNavigation(event: MouseEvent) {
    if (onClick) event.stopPropagation();
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "@container shadow-sm hover:shadow-lg transition-shadow",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex flex-col justify-between gap-3 px-3 py-2 @min-[320px]:flex-row @min-[320px]:items-center @md:gap-4 @md:px-6 @md:py-4">
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
            onClick={stopCardNavigation}
          >
            {trailing}
          </div>
        )}
      </div>
    </Card>
  );
}
