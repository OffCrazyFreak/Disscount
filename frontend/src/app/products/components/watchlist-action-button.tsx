import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import WatchlistItemModal from "@/app/products/components/forms/watchlist-item-modal";

interface IWatchlistActionButtonProps {
  product: ProductResponse;
  isInWatchlist: boolean;
}

export default function WatchlistActionButton({
  product,
  isInWatchlist,
}: IWatchlistActionButtonProps) {
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const actionLabel = isInWatchlist ? "Ažuriraj praćenje" : "Prati proizvod";

  return (
    <>
      {isWatchlistModalOpen && (
        <WatchlistItemModal
          isOpen={isWatchlistModalOpen}
          onOpenChange={setIsWatchlistModalOpen}
          product={product}
        />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            aria-label={actionLabel}
            className="size-10 sm:size-12 shrink-0"
            onClick={() => {
              setIsWatchlistModalOpen(true);
            }}
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
    </>
  );
}
