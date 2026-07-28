"use client";

import { type ComponentProps, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import ProductOverlayLink from "@/components/custom/product/product-overlay-link";
import ProductSummary from "@/components/custom/product/product-summary";
import { cn } from "@/lib/utils";

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
}: IProductCardProps) {
  // The card owns the long-press gesture, so a press on its action controls
  // must not reach it. Stopping click alone still let a hold there open the sheet
  // and then run the button on release.
  const actionProps = pressProps
    ? {
        onClick: stopEvent,
        onPointerDown: stopEvent,
        onPointerUp: stopEvent,
      }
    : undefined;

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
      <ProductOverlayLink ean={ean} name={name} onNavigate={onNavigate} />

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
      />
    </Card>
  );
}
