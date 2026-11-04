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

/** The rhythm lives here because the two cards sit in the same lists and drifted apart in height with their own spacing. */
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

      {/* Neither truthiness nor a null check, because 0 is a legitimate price and `condition && <Price/>` yields false, which would draw a separator over nothing. */}
      {secondary != null && typeof secondary !== "boolean" && (
        <>
          {/* Margin on both sides, because a 24px icon overhangs its 20px line box and a flush divider touches the glyph. */}
          <Separator className="my-1" />

          <div className="flex items-center justify-center gap-2">
            {secondary}
          </div>
        </>
      )}
    </div>
  );
}
