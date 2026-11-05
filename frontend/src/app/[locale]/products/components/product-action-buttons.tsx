import { Image as ImageIcon, ListPlus, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import ListPen from "@/components/custom/icons/list-pen";
import { useUser } from "@/context/user-context";
import { PRODUCT_ACTION_LABELS } from "@/constants/product-action-labels";
import { useIsOnPreselectedShoppingList } from "@/hooks/use-preselected-list-membership";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { cn } from "@/lib/utils";
import { productImageSearchUrl } from "@/utils/product-links";
import { openExternal } from "@/utils/browser/open-external";
import WatchlistActionButton from "@/app/[locale]/products/components/watchlist-action-button";
import useProductModals from "@/hooks/use-product-modals";
import useProductShare from "@/hooks/use-product-share";
import { watchlistService } from "@/lib/api";

interface IProductActionButtonsProps {
  product: ProductResponse;
  className?: string;
}

export default function ProductActionButtons({
  product,
  className,
}: IProductActionButtonsProps) {
  const t = useTranslations("products");
  // Guarded on a session because /products is public, and a read would 401 for signed-out visitors.
  const { user } = useUser();
  const { data: currentUserWatchlist = [] } =
    watchlistService.useGetCurrentUserWatchlist({ enabled: !!user });

  const { openAddToList } = useProductModals(product);
  const share = useProductShare(product);

  const isInWatchlist = currentUserWatchlist.some(
    (watchlistItem) => watchlistItem.productApiId === product.ean,
  );

  // Speaks for whichever list the modal will preselect: a drafted choice if there is one, the newest list otherwise.
  const isOnList = useIsOnPreselectedShoppingList(product.ean);
  const addToListLabel = t(
    isOnList
      ? PRODUCT_ACTION_LABELS.editListEntry
      : PRODUCT_ACTION_LABELS.addToList,
  );

  return (
    <div
      role="group"
      aria-label={t("actions.group")}
      className={cn("flex items-center gap-1 sm:gap-2", className)}
    >
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

      <WatchlistActionButton product={product} isInWatchlist={isInWatchlist} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            aria-label={t("actions.share")}
            className="shrink-0"
            onClick={share}
          >
            <Share2 />
          </Button>
        </TooltipTrigger>

        <TooltipContent className="px-2 py-1 text-xs">
          {t("actions.share")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            aria-label={t("actions.searchImage")}
            className="shrink-0"
            onClick={() => openExternal(productImageSearchUrl(product))}
          >
            <ImageIcon />
          </Button>
        </TooltipTrigger>

        <TooltipContent className="px-2 py-1 text-xs">
          {t("actions.searchImage")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
