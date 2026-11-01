import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

import { Banner } from "@/components/custom/common/banner";
import { Button } from "@/components/ui/button";
import { PRICE_STATUS_BANNER_ID } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";

interface IShoppingListPriceStatusProps {
  failedCount: number;
  isRetrying: boolean;
  onRetry: () => void;
}

/**
 * One notice for every item whose prices failed, instead of one per row. The live region
 * stays mounted while silent, so a failure that arrives later is still announced.
 */
export default function ShoppingListPriceStatus({
  failedCount,
  isRetrying,
  onRetry,
}: IShoppingListPriceStatusProps) {
  const t = useTranslations("shoppingListDetail");

  return (
    <div role="status">
      {failedCount > 0 && (
        <Banner
          variant="warningSoft"
          size="md"
          icon={TriangleAlert}
          className="mb-0"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p id={PRICE_STATUS_BANNER_ID}>
              {t("prices.failedCount", { count: failedCount })}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isRetrying}
              loadingText={t("prices.retry")}
              loadingIconPlacement="left"
              onClick={onRetry}
            >
              {t("prices.retry")}
            </Button>
          </div>
        </Banner>
      )}
    </div>
  );
}
