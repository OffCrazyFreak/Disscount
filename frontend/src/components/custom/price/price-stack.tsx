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

/**
 * Two tiers of figures split by a divider, as both the product card and the
 * watchlist card trail their rows with. The rhythm lives here because the two
 * cards sit in the same lists and drifted apart in height once each owned its
 * own spacing.
 */
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

      {/* Neither a truthiness check nor a plain null check. 0 is a legitimate price that
          truthiness would drop, while false is what `condition && <Price/>` yields and
          renders nothing, so it would draw a separator above an empty tier. */}
      {secondary != null && typeof secondary !== "boolean" && (
        <>
          {/* Margin on both sides: a 24px icon overhangs the 20px line box it
              sits in, so a divider flush to the tier touches the glyph. */}
          <Separator className="my-1" />

          <div className="flex items-center justify-center gap-2">
            {secondary}
          </div>
        </>
      )}
    </div>
  );
}
