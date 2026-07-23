import { Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { productByEanQueryKey } from "@/lib/cijene-api";

interface IWatchlistActionButtonProps {
  product: ProductResponse;
  isInWatchlist: boolean;
}

export default function WatchlistActionButton({
  product,
  isInWatchlist,
}: IWatchlistActionButtonProps) {
  const queryClient = useQueryClient();
  const actionLabel = isInWatchlist ? "Ažuriraj praćenje" : "Prati proizvod";

  // Seed the by-ean cache so the URL-driven modal shows the product instantly.
  function openWatchlist() {
    queryClient.setQueryData(productByEanQueryKey(product.ean), product);
    openModalUrl({ name: "watchlist", ean: product.ean });
  }

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
