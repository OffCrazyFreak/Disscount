import { useState } from "react";
import { Eye, EyeOff, Image, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { cn } from "@/lib/utils";
import AddToShoppingListForm from "@/app/products/components/forms/add-to-shopping-list-form";
import WatchlistItemModal from "@/app/products/components/forms/watchlist-item-modal";
import { formatQuantity } from "@/utils/strings";
import { watchlistService } from "@/lib/api";

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
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);

  // Check if product is in watchlist
  const { data: existingWatchlistItems = [] } =
    watchlistService.useGetWatchlistItemsByProductApiId(product?.ean || "");
  const isInWatchlist = existingWatchlistItems.length > 0;

  return (
    <>
      <AddToShoppingListForm
        isOpen={isAddToListModalOpen}
        onOpenChange={setIsAddToListModalOpen}
        product={product}
      />

      <WatchlistItemModal
        isOpen={isWatchlistModalOpen}
        onOpenChange={setIsWatchlistModalOpen}
        product={product}
      />

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
                <Image className="size-6 sm:size-7" />
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
                onClick={() => {
                  setIsAddToListModalOpen(true);
                }}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Prati proizvod"
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
              {isInWatchlist ? "Ažuriraj praćenje" : "Prati proizvod"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}
