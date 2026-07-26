"use client";

import { KeyboardEvent, ReactNode, type ComponentProps } from "react";

import { Card } from "@/components/ui/card";
import ProductSummary from "@/components/custom/product/product-summary";
import { cn } from "@/lib/utils";

interface IProductCardProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  /** `viaKeyboard` lets a consumer skip a gesture guard that only pointers need */
  onClick?: (viaKeyboard?: boolean) => void;
  isLoading?: boolean;
  trailing?: ReactNode;
  className?: string;
  /** Pointer handlers from useLongPress, for the quick-actions gesture */
  pressProps?: Pick<
    ComponentProps<"div">,
    | "onPointerDown"
    | "onPointerMove"
    | "onPointerUp"
    | "onPointerCancel"
    | "onPointerLeave"
    | "onContextMenu"
  >;
}

function stopEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/**
 * A product as a tappable row in a list. The row's own contents live in
 * ProductSummary, so a surface that wants the product without the card, such as
 * the quick-actions sheet, takes that instead of restyling this.
 */
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
  pressProps,
}: IProductCardProps) {
  // The card owns the long-press gesture, so a press on the trailing controls
  // must not reach it. Stopping click alone still let a hold there open the sheet
  // and then run the button on release.
  const trailingProps =
    onClick || pressProps
      ? {
          onClick: stopEvent,
          onPointerDown: stopEvent,
          onPointerUp: stopEvent,
        }
      : undefined;

  function handleCardKeyDown(event: KeyboardEvent) {
    if (!onClick) return;
    // Ignore keydowns bubbled from focusable controls inside the card.
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(true);
    }
  }

  return (
    <Card
      onClick={onClick ? () => onClick() : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleCardKeyDown : undefined}
      {...pressProps}
      className={cn(
        "shadow-sm hover:shadow-lg transition-shadow",
        onClick && "cursor-pointer",
        // Suppresses the iOS selection callout a long press would raise, on touch
        // only, so a pointer user can still select the product's name.
        pressProps &&
          "[@media(hover:none)]:select-none [-webkit-touch-callout:none]",
        className,
      )}
    >
      <ProductSummary
        name={name}
        brand={brand}
        category={category}
        quantity={quantity}
        imageUrl={imageUrl}
        isLoading={isLoading}
        trailing={trailing}
        trailingProps={trailingProps}
      />
    </Card>
  );
}
