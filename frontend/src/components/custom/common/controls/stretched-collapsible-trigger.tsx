"use client";

import type { ComponentProps } from "react";

import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Stretches over a `relative isolate` ancestor, so other controls there stay sibling buttons with `relative z-10`. */
export default function StretchedCollapsibleTrigger({
  className,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>) {
  return (
    <CollapsibleTrigger
      className={cn(
        "py-0 text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary",
        className,
      )}
      {...props}
    />
  );
}
