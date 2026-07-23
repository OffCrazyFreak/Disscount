import { Image as ImageIcon, ListPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { cn } from "@/lib/utils";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { formatQuantity } from "@/utils/strings";
import WatchlistActionButton from "@/app/products/components/watchlist-action-button";
import { watchlistService } from "@/lib/api";
import { productByEanQueryKey } from "@/lib/cijene-api";

interface IProductActionButtonsProps {
  product: ProductResponse;
  showSearchImage?: boolean;
  showAddToList?: boolean;
  showAddToWatchlist?: boolean;
  className?: string;
}

export default function ProductActionButtons({
  product,
  showSearchImage = true,
  showAddToList = true,
  showAddToWatchlist = true,
  className,
}: IProductActionButtonsProps) {
  const queryClient = useQueryClient();
  const { data: currentUserWatchlist = [] } =
    watchlistService.useGetCurrentUserWatchlist();

  const isInWatchlist = currentUserWatchlist.some(
    (watchlistItem) => watchlistItem.productApiId === product.ean,
  );

  // Seeds the by-ean cache, since the URL-driven modal takes no props.
  function openAddToList() {
    queryClient.setQueryData(productByEanQueryKey(product.ean), product);
    openModalUrl({ name: "add-to-list", ean: product.ean });
  }

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
                onClick={() => {
                  let searchQuery = `${product.name}`;

                  if (product.brand) {
                    searchQuery += ` ${product.brand}`;
                  }

                  if (product.quantity) {
                    searchQuery += ` ${formatQuantity(product.quantity)}`;
                  }

                  const googleShoppingUrl = `https://www.google.com/search?udm=2&q=${encodeURIComponent(
                    searchQuery,
                  )}`;
                  window.open(googleShoppingUrl, "_blank");
                }}
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
                onClick={openAddToList}
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
      </div>
    </>
  );
}
