import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface IBottomNavItemGlyphProps {
  icon: LucideIcon;
  /** Swells under a thumb, so the cell answers before it commits */
  isPressed: boolean;
  badgeCount?: number;
  /** A re-tap would return to the saved scroll position */
  showsReturn?: boolean;
}

/**
 * The icon and its two overlays, which hang off the icon's own box rather than
 * the cell's, so neither moves when the label collapses on scroll.
 */
export default function BottomNavItemGlyph({
  icon: Icon,
  isPressed,
  badgeCount,
  showsReturn,
}: IBottomNavItemGlyphProps) {
  return (
    <span className="relative flex items-center justify-center">
      <Icon
        className={cn(
          "relative size-[1.5rem] transition-transform duration-150 motion-reduce:transition-none",
          isPressed && "scale-115",
        )}
      />

      {badgeCount !== undefined && (
        <Badge size="count" className="absolute -top-2 -right-3">
          {badgeCount}
        </Badge>
      )}

      {showsReturn && (
        <ChevronDown
          aria-hidden="true"
          className="text-primary absolute -bottom-2 size-[0.7rem]"
        />
      )}
    </span>
  );
}
