import { useEffect, useRef, useState } from "react";
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
  const [hasRetried, setHasRetried] = useState(false);
  const successRef = useRef<HTMLParagraphElement>(null);
  const isRecovered = hasRetried && failedCount === 0;

  // The retry button unmounts once every price loads, so focus moves to the outcome instead of the page top.
  useEffect(() => {
    if (isRecovered) successRef.current?.focus();
  }, [isRecovered]);

  function retry() {
    setHasRetried(true);
    onRetry();
  }

  return (
    <div role="status">
      {isRecovered && (
        <p
          ref={successRef}
          tabIndex={-1}
          className="text-sm text-muted-foreground outline-none"
        >
          {t("prices.retrySucceeded")}
        </p>
      )}

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
              onClick={retry}
            >
              {t("prices.retry")}
            </Button>
          </div>
        </Banner>
      )}
    </div>
  );
}
