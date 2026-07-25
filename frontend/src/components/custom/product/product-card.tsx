"use client";

import { KeyboardEvent, MouseEvent, ReactNode } from "react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductInfo from "@/components/custom/product/product-info";
import useLongPress from "@/hooks/use-long-press";
import { cn } from "@/lib/utils";

interface IProductCardProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  onClick?: () => void;
  /** Opens the card's quick actions; every one is also a visible control */
  onLongPress?: () => void;
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
  onLongPress,
  isLoading = false,
  trailing,
  className,
}: IProductCardProps) {
  const displayName = name && quantity ? `${name} (${quantity})` : name;
  const longPress = useLongPress(() => onLongPress?.(), Boolean(onLongPress));

  function stopCardNavigation(event: MouseEvent) {
    if (onClick) event.stopPropagation();
  }

  // A fired hold swallows the click the release would otherwise make.
  function handleCardClick() {
    if (longPress.consumeFired()) return;

    onClick?.();
  }

  function handleCardKeyDown(event: KeyboardEvent) {
    if (!onClick) return;
    // Ignore keydowns bubbled from focusable controls inside the card.
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <Card
      data-long-press={onLongPress ? "" : undefined}
      onClick={onClick ? handleCardClick : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleCardKeyDown : undefined}
      {...longPress.handlers}
      // Gives under the thumb as the hold's progress builds, so a press that
      // outlives the gate shows something without the card growing new chrome.
      style={
        onLongPress
          ? { scale: "calc(1 - 0.02 * var(--long-press-progress, 0))" }
          : undefined
      }
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
