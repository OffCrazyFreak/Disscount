import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { LOADING_LABELS } from "@/constants/loading-labels";
import { cn } from "@/lib/utils";

interface IWatchlistActionButtonProps {
  visibilityClassName: string;
  isAddMode: boolean;
  isRemoving: boolean;
  hasProduct: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

export default function WatchlistActionButton({
  visibilityClassName,
  isAddMode,
  isRemoving,
  hasProduct,
  onAdd,
  onRemove,
}: IWatchlistActionButtonProps) {
  const label = isAddMode ? "Prati proizvod" : "Makni proizvod";
  // Icon-only, so the spinner is the whole visual and the name carries the copy.
  const currentLabel = isRemoving ? LOADING_LABELS.deleting : label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={currentLabel}
          className={cn(
            visibilityClassName,
            isAddMode
              ? "bg-primary hover:bg-primary/90"
              : "bg-red-600 hover:bg-red-700",
          )}
          onClick={isAddMode ? onAdd : onRemove}
          disabled={isAddMode ? !hasProduct : isRemoving}
        >
          {isAddMode ? (
            <Eye />
          ) : isRemoving ? (
            <BlockLoadingSpinner size={24} className="text-inherit" />
          ) : (
            <X />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent
        variant={isAddMode ? "primary" : "destructive"}
        className="px-2 py-1 text-xs"
      >
        {currentLabel}
      </TooltipContent>
    </Tooltip>
  );
}
