"use client";

import { Eye, Image as ImageIcon, ListPlus, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import QuickActionItem from "@/components/custom/common/quick-action-item";
import { PRODUCT_ACTION_LABELS } from "@/constants/product-action-labels";
import EyePen from "@/components/custom/icons/eye-pen";
import ListPen from "@/components/custom/icons/list-pen";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { watchlistService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { useIsOnPreselectedShoppingList } from "@/hooks/use-preselected-list-membership";
import useProductModals from "@/hooks/use-product-modals";
import useProductShare from "@/hooks/use-product-share";
import { productImageSearchUrl } from "@/utils/product-links";
import { openExternal } from "@/utils/browser/open-external";
import type { IOpenModalOptions } from "@/lib/modal/modal-navigation";

interface IProductQuickActionsListProps {
  product: ProductResponse;
  onClose: () => void;
}

/** Split from the sheet so the shell can render a pending or missing-product state without a product. */
export default function ProductQuickActionsList({
  product,
  onClose,
}: IProductQuickActionsListProps) {
  const t = useTranslations("products");
  const { user } = useUser();
  const { openAddToList, openWatchlist } = useProductModals(product);
  const share = useProductShare(product);

  // The same reads as the row's buttons so they never disagree; guarded on a session because /products is public and would 401 for signed-out visitors.
  const { data: currentUserWatchlist = [] } =
    watchlistService.useGetCurrentUserWatchlist({ enabled: !!user });
  const isInWatchlist = currentUserWatchlist.some(
    (watchlistItem) => watchlistItem.productApiId === product.ean,
  );
  const isOnList = useIsOnPreselectedShoppingList(product.ean);

  // Replaces this sheet's history entry because closeModalUrl pops with an async history.back(), which would throw away a push right after it.
  function swapToModal(open: (options: IOpenModalOptions) => void) {
    open({ replace: true });
  }

  function runAndClose(action: () => void) {
    onClose();
    action();
  }

  return (
    <>
      <QuickActionItem
        icon={isOnList ? ListPen : ListPlus}
        label={t(
          isOnList
            ? PRODUCT_ACTION_LABELS.editListEntry
            : PRODUCT_ACTION_LABELS.addToList,
        )}
        onSelect={() => swapToModal(openAddToList)}
      />

      <QuickActionItem
        icon={isInWatchlist ? EyePen : Eye}
        label={t(
          isInWatchlist
            ? PRODUCT_ACTION_LABELS.editWatch
            : PRODUCT_ACTION_LABELS.watch,
        )}
        onSelect={() => swapToModal(openWatchlist)}
      />

      <QuickActionItem
        icon={Share2}
        label={t("actions.share")}
        onSelect={() => runAndClose(share)}
      />

      <QuickActionItem
        icon={ImageIcon}
        label={t("actions.searchImage")}
        onSelect={() =>
          runAndClose(() => openExternal(productImageSearchUrl(product)))
        }
      />
    </>
  );
}
