"use client";

import { type ComponentProps, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import HoldProgressRing from "@/components/custom/common/hold-progress-ring";
import ProductSummary from "@/components/custom/product/product-summary";
import { cn } from "@/lib/utils";
import { productPath } from "@/utils/product-links";

interface IProductCardProps {
  ean: string;
  name: string | null;
  brand?: string | null;
  category: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  /** Returning false cancels navigation, for example after a long press */
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
  isLoading?: boolean;
  trailing?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Pointer handlers from useCardLongPress, for the quick-actions gesture */
  pressProps?: Pick<
    ComponentProps<"div">,
    | "onPointerDown"
    | "onPointerMove"
    | "onPointerUp"
    | "onPointerCancel"
    | "onPointerLeave"
    | "onContextMenu"
  >;
  /** Shields action controls from the card's own gesture */
  actionProps?: Pick<
    ComponentProps<"div">,
    "onClick" | "onPointerDown" | "onPointerUp"
  >;
}

/**
 * A product as a tappable row in a list. The row's own contents live in
 * ProductSummary, so a surface that wants the product without the card, such as
 * the quick-actions sheet, takes that instead of restyling this.
 */
export default function ProductCard({
  ean,
  name,
  brand,
  category,
  quantity,
  imageUrl,
  onNavigate,
  isLoading = false,
  trailing,
  actions,
  className,
  pressProps,
  actionProps,
}: IProductCardProps) {
  return (
    <Card
      {...pressProps}
      className={cn(
        "relative shadow-sm hover:shadow-lg transition-shadow",
        // Suppresses the iOS selection callout a long press would raise on touch.
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
        actions={actions}
        actionProps={actionProps}
        href={productPath(ean)}
        onNavigate={onNavigate}
      />

      {/* Draws nothing until a hold starts, so it can stay mounted. This is the
          only cue that holding the card does anything, since the row shows no
          inline actions on touch. */}
      {pressProps && (
        <HoldProgressRing
          progress="var(--press-progress, 0)"
          className="absolute top-1/2 left-1/2 size-[3.6rem] -translate-x-1/2 -translate-y-1/2 stroke-primary"
        />
      )}
    </Card>
  );
}
