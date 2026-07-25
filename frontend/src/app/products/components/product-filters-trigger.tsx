import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IProductFiltersTriggerProps {
  count: number;
  /** Set only where the button toggles in place, which adds a flipping chevron */
  expanded?: boolean;
  className?: string;
  onClick: () => void;
}

/** Shared by the page, which opens the sheet, and the sheet, which toggles. */
export default function ProductFiltersTrigger({
  count,
  expanded,
  className,
  onClick,
}: IProductFiltersTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("bg-white", className)}
      onClick={onClick}
    >
      <SlidersHorizontal className="size-4" />
      Filteri
      {count > 0 && <Badge size="count">{count}</Badge>}
      {expanded !== undefined && (
        <ChevronDown
          className={cn(
            "size-4 transition-transform motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
        />
      )}
    </Button>
  );
}
