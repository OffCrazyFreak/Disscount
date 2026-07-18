import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={label}
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
            <Eye className="size-5 sm:size-6" />
          ) : isRemoving ? (
            <BlockLoadingSpinner size={22} className="text-inherit" />
          ) : (
            <X className="size-5 sm:size-6" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent
        variant={isAddMode ? "default" : "destructive"}
        className="px-2 py-1 text-xs"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
