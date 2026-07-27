import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
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

  const actionLabel = isInWatchlist ? "Ažuriraj praćenje" : "Prati proizvod";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={actionLabel}
          className={cn("shrink-0", className)}
          onClick={() => openWatchlist()}
        >
          {isInWatchlist ? (
            <EyeOff className="size-6 sm:size-7" />
          ) : (
            <Eye className="size-6 sm:size-7" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent className="px-2 py-1 text-xs">
        {actionLabel}
      </TooltipContent>
    </Tooltip>
  );
}
