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
  /** Returning false cancels navigation, for example after a long press */
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
  isLoading?: boolean;
  trailing?: ReactNode;
  actions?: ReactNode;
  /** Applied to the actions wrapper, so hiding them hides the row gap too. */
  actionsClassName?: string;
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

/** Contents live in ProductSummary, so a surface without the card need not restyle this. */
export default function ProductCard({
  ean,
  name,
  brand,
  category,
  quantity,
  onNavigate,
  isLoading = false,
  trailing,
  actions,
  actionsClassName,
  className,
  pressProps,
  actionProps,
}: IProductCardProps) {
  return (
    <Card
      {...pressProps}
      className={cn(
        "relative isolate shadow-sm hover:shadow-lg transition-shadow",
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
        ean={ean}
        isLoading={isLoading}
        trailing={trailing}
        actions={actions}
        actionsClassName={actionsClassName}
        actionProps={actionProps}
        href={productPath(ean)}
        onNavigate={onNavigate}
      />

      {/* The only cue that holding does anything, since the row shows no inline actions on touch. */}
      {pressProps && (
        <HoldProgressRing
          progress="var(--press-progress, 0)"
          className="absolute top-1/2 left-1/2 size-[3.6rem] -translate-x-1/2 -translate-y-1/2 stroke-primary"
        />
      )}
    </Card>
  );
}
