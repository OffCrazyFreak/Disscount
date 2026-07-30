import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { LOADING_LABELS } from "@/constants/loading-labels";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IRemoveItemButtonProps {
  visibilityClassName: string;
  onDelete: () => void;
  isDeleting: boolean;
}

// Rendered in both the mobile and desktop rows, so styling lives in one place.
export default function RemoveItemButton({
  visibilityClassName,
  onDelete,
  isDeleting,
}: IRemoveItemButtonProps) {
  // Icon-only, so the spinner is the whole visual and the name carries the copy.
  const label = isDeleting ? LOADING_LABELS.deleting : "Makni proizvod";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={label}
          className={cn(
            "shrink-0 bg-red-600 hover:bg-red-700",
            visibilityClassName,
          )}
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <BlockLoadingSpinner size={24} className="text-inherit" />
          ) : (
            <X />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent variant="destructive" className="px-2 py-1 text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
