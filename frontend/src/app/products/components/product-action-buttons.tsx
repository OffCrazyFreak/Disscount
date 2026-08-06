import { Image as ImageIcon, ListPlus, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ListPen from "@/components/custom/icons/list-pen";
import { useIsOnPreselectedShoppingList } from "@/lib/api/shopping-lists/use-preselected-list-membership";
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

  // Speaks for whichever list the modal will preselect: a drafted choice if there
  // is one, the newest list otherwise.
  const isOnList = useIsOnPreselectedShoppingList(product.ean);
  const addToListLabel = isOnList
    ? "Uredi unos na popisu za kupnju"
    : "Dodaj na popis za kupnju";

  const actions = (
    <>
      {showAddToList && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label={addToListLabel}
              className="shrink-0"
              onClick={() => openAddToList()}
            >
              {isOnList ? <ListPen /> : <ListPlus />}
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            {addToListLabel}
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
              className="shrink-0"
              onClick={share}
            >
              <Share2 />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Podijeli proizvod
          </TooltipContent>
        </Tooltip>
      )}

      {showSearchImage && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label="Pretraži sliku proizvoda"
              className="shrink-0"
              onClick={() => openExternal(productImageSearchUrl(product))}
            >
              <ImageIcon />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Pretraži sliku proizvoda
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );

  return (
    <div
      role="group"
      aria-label="Radnje proizvoda"
      className={cn("flex items-center gap-1 sm:gap-2", className)}
    >
      {actions}
    </div>
  );
}
