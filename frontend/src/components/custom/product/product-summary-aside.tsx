"use client";

import { type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface IProductSummaryAsideProps {
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
}

/** The right-hand side of a product summary: prices, then actions. */
export default function ProductSummaryAside({
  trailing,
  actions,
  actionsClassName,
  actionProps,
}: IProductSummaryAsideProps) {
  if (!trailing && !actions) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-4">
      {/* Raised above the name link's stretched pseudo-element so prices
          stay selectable; actions go a layer higher again so they keep
          receiving pointer events without opting in class by class. */}
      {trailing && <div className="relative z-10">{trailing}</div>}

      {actions && (
        <div className={cn("relative z-20", actionsClassName)} {...actionProps}>
          {actions}
        </div>
      )}
    </div>
  );
}
