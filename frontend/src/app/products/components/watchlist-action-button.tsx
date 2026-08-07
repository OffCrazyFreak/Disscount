import { Eye } from "lucide-react";

import { PRODUCT_ACTION_LABELS } from "@/constants/product-action-labels";
import { Button } from "@/components/ui/button";
import EyePen from "@/components/custom/icons/eye-pen";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import useProductModals from "@/hooks/use-product-modals";
import { cn } from "@/lib/utils";

interface IWatchlistActionButtonProps {
  product: ProductResponse;
  isInWatchlist: boolean;
  className?: string;
}

export default function WatchlistActionButton({
  product,
  isInWatchlist,
  className,
}: IWatchlistActionButtonProps) {
  const { openWatchlist } = useProductModals(product);

  const actionLabel = isInWatchlist
    ? PRODUCT_ACTION_LABELS.editWatch
    : PRODUCT_ACTION_LABELS.watch;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={actionLabel}
          className={cn("shrink-0", className)}
          onClick={() => openWatchlist()}
        >
          {/* A pen, not an eye-off: the button opens the tracking settings, it never
              stops the tracking, which is what a slashed eye promises. */}
          {isInWatchlist ? <EyePen /> : <Eye />}
        </Button>
      </TooltipTrigger>

      <TooltipContent className="px-2 py-1 text-xs">
        {actionLabel}
      </TooltipContent>
    </Tooltip>
  );
}
