import { type ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface IPriceStackProps {
  primary: ReactNode;
  /** Omit to render a single tier with no divider under it. */
  secondary?: ReactNode;
  /** For a primary tier that has to wrap on a narrow card. */
  primaryClassName?: string;
  className?: string;
}

/** The rhythm lives here because the two cards share lists and drifted apart in height. */
export default function PriceStack({
  primary,
  secondary,
  primaryClassName,
  className,
}: IPriceStackProps) {
  return (
    <div className={cn("text-sm", className)}>
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          primaryClassName,
        )}
      >
        {primary}
      </div>

      {/* 0 is a legitimate price, and `condition && <Price/>` yields false, which would draw a lone separator. */}
      {secondary != null && typeof secondary !== "boolean" && (
        <>
          {/* A 24px icon overhangs its 20px line box, so a flush divider would touch the glyph. */}
          <Separator className="my-1" />

          <div className="flex items-center justify-center gap-2">
            {secondary}
          </div>
        </>
      )}
    </div>
  );
}
