import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import useProductModals from "@/hooks/use-product-modals";

interface IWatchlistActionButtonProps {
  product: ProductResponse;
  isInWatchlist: boolean;
}

export default function WatchlistActionButton({
  product,
  isInWatchlist,
}: IWatchlistActionButtonProps) {
  const { openWatchlist } = useProductModals(product);

  const actionLabel = isInWatchlist ? "Ažuriraj praćenje" : "Prati proizvod";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={actionLabel}
          className="size-10 sm:size-12 shrink-0"
          onClick={openWatchlist}
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
