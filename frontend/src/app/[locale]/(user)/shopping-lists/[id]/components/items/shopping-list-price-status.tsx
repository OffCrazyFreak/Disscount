import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

import { Banner } from "@/components/custom/common/banner";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { Button } from "@/components/ui/button";
import { PRICE_STATUS_BANNER_ID } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";

interface IShoppingListPriceStatusProps {
  failedCount: number;
  isRetrying: boolean;
  /** Resolves true when every retried price loaded. */
  onRetry: () => Promise<boolean>;
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
  const [hasRetryLoadedAll, setHasRetryLoadedAll] = useState(false);
  const successRef = useRef<HTMLParagraphElement>(null);
  const isRecovered = hasRetryLoadedAll && failedCount === 0;

  // The retry button unmounts once every price loads; when it took focus with it, hand focus
  // to the outcome instead of the page top, but never pull focus away from anything else.
  useEffect(() => {
    if (isRecovered && document.activeElement === document.body) {
      successRef.current?.focus();
    }
  }, [isRecovered]);

  async function retry() {
    if (isRetrying) return;
    setHasRetryLoadedAll(false);
    setHasRetryLoadedAll(await onRetry());
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

            {/* aria-disabled, not the loading prop: that sets disabled, which drops keyboard focus. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-disabled={isRetrying || undefined}
              onClick={retry}
            >
              {isRetrying && <BlockLoadingSpinner size={18} />}
              {t("prices.retry")}
            </Button>
          </div>
        </Banner>
      )}
    </div>
  );
}
