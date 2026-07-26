import { Image as ImageIcon, ListPlus, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { cn } from "@/lib/utils";
import { productImageSearchUrl } from "@/utils/product-links";
import { openExternal } from "@/utils/browser/open-external";
import WatchlistActionButton from "@/app/products/components/watchlist-action-button";
import useProductModals from "@/hooks/use-product-modals";
import useProductShare from "@/hooks/use-product-share";
import { watchlistService } from "@/lib/api";

interface IProductActionButtonsProps {
  product: ProductResponse;
  showSearchImage?: boolean;
  showAddToList?: boolean;
  showAddToWatchlist?: boolean;
  showShare?: boolean;
  className?: string;
}

export default function ProductActionButtons({
  product,
  showSearchImage = true,
  showAddToList = true,
  showAddToWatchlist = true,
  showShare = true,
  className,
}: IProductActionButtonsProps) {
  const { data: currentUserWatchlist = [] } =
    watchlistService.useGetCurrentUserWatchlist();

  const { openAddToList } = useProductModals(product);
  const share = useProductShare(product);

  const isInWatchlist = currentUserWatchlist.some(
    (watchlistItem) => watchlistItem.productApiId === product.ean,
  );

  return (
    <>
      <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
        {showSearchImage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Pretraži sliku proizvoda"
                className="size-10 sm:size-12 shrink-0"
                onClick={() => openExternal(productImageSearchUrl(product))}
              >
                <ImageIcon className="size-6 sm:size-7" />
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Pretraži sliku proizvoda
            </TooltipContent>
          </Tooltip>
        )}

        {showAddToList && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Dodaj na popis za kupnju"
                className="size-10 sm:size-12 shrink-0"
                onClick={() => openAddToList()}
              >
                <ListPlus className="size-6 sm:size-7" />
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Dodaj na popis za kupnju
            </TooltipContent>
          </Tooltip>
        )}

        {showAddToWatchlist && (
          <WatchlistActionButton
            product={product}
            isInWatchlist={isInWatchlist}
          />
        )}

        {showShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Podijeli proizvod"
                className="size-10 sm:size-12 shrink-0"
                onClick={share}
              >
                <Share2 className="size-6 sm:size-7" />
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Podijeli proizvod
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}
