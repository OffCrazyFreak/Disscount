"use client";

import type { ComponentProps } from "react";

import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * A disclosure toggle that sits inside a heading and stretches over its
 * positioned ancestor through a pseudo-element, so a whole card header toggles
 * while other controls in it stay real siblings, raised above with `relative
 * z-10`. The ancestor must be `relative isolate`, as for `StretchedLink`.
 */
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
