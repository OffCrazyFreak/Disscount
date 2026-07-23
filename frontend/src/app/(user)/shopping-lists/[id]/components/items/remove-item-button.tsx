import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label="Makni proizvod"
          className={cn(
            "size-8 sm:size-10 shrink-0 bg-red-600 hover:bg-red-700",
            visibilityClassName,
          )}
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <BlockLoadingSpinner size={22} className="text-inherit" />
          ) : (
            <X className="size-5 sm:size-6" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent variant="destructive" className="px-2 py-1 text-xs">
        Makni proizvod
      </TooltipContent>
    </Tooltip>
  );
}
