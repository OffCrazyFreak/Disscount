"use client";

import { memo, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, TriangleAlert } from "lucide-react";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import StretchedCollapsibleTrigger from "@/components/custom/common/stretched-collapsible-trigger";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChainLabel } from "@/utils/labels";
import { cn } from "@/lib/utils";
import {
  ChainProductResponse,
  ProductResponse,
  StorePrice,
} from "@/lib/cijene-api/schemas";
import { formatDate } from "@/utils/strings";
import { useUser } from "@/context/user-context";
import StorePriceSummary from "@/app/[locale]/products/[id]/components/store-item/store-price-summary";
import StorePricesDetails, {
  type StorePricesStatus,
} from "@/app/[locale]/products/[id]/components/store-item/store-prices-details";
import NearestStoreDistance from "@/components/custom/distance-sort/nearest-store-distance";
import { TIME_ZONE } from "@/i18n/formatting";
import type { INearestStore } from "@/utils/nearest-chain-distance";

interface IStoreItemProps {
  store: ChainProductResponse;
  storePrices: StorePrice[];
  /** Status of the per-store prices request, which may still be loading */
  pricesStatus: StorePricesStatus;
  product: ProductResponse;
  isExpanded?: boolean;
  onToggle?: () => void;
  /** The nearest store carrying it, while sorting by distance from a location fix. */
  nearest?: INearestStore;
}

const StoreItem = memo(
  ({
    isExpanded,
    onToggle,
    store,
    storePrices,
    pricesStatus,
    product,
    nearest,
  }: IStoreItemProps) => {
    const t = useTranslations("productDetail.storeItem");
    const locale = useLocale();
    const { accountUser } = useUser();
    const id = useId();

    const isPreferred =
      accountUser?.pinnedStores?.some((s) => s.storeApiId === store.chain) ||
      false;

    // price_date is a Croatian calendar date; en-CA formats as YYYY-MM-DD.
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
    }).format(new Date());
    const isDataFromToday = store.price_date === today;
    const describedBy = [
      `${id}-warning`,
      `${id}-prices`,
      nearest && `${id}-nearest`,
      `${id}-action`,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          {/* The toggle stretches over the header instead of wrapping it, so the
              opening badge can be its own button beside it. */}
          <CardHeader className="relative isolate flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              {/* Store Chain Image */}
              <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                <StoreChainLogo
                  chain={store.chain}
                  className={cn(
                    "object-contain w-full h-full",
                    !isPreferred &&
                      (accountUser?.pinnedStores?.length ?? 0) > 0 &&
                      "opacity-40",
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                {/* Chain Name and Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">
                    <StretchedCollapsibleTrigger aria-describedby={describedBy}>
                      {getChainLabel(store.chain)}
                    </StretchedCollapsibleTrigger>
                  </h3>

                  <div id={`${id}-warning`} className="flex items-center gap-3">
                    {!isDataFromToday && (
                      <Badge variant="warningSoft">
                        <TriangleAlert className="size-4 mr-1" />
                        {t("dataFrom", {
                          date: formatDate(store.price_date, locale),
                        })}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price Information */}
                <div id={`${id}-prices`} className="mt-2">
                  <StorePriceSummary store={store} product={product} />
                </div>

                {nearest && (
                  <div id={`${id}-nearest`} className="mt-1">
                    <NearestStoreDistance nearest={nearest} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-end gap-4">
              <p
                id={`${id}-action`}
                className="hidden sm:inline text-gray-700 text-sm text-pretty text-right"
              >
                {t("pricesByLocation")}
              </p>

              <ChevronDown
                className={cn(
                  "size-8 text-gray-500 transition-transform motion-reduce:transition-none",
                  isExpanded && "rotate-180",
                )}
                aria-hidden="true"
              />
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              <StorePricesDetails
                storePrices={storePrices}
                status={pricesStatus}
                product={product}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  },
);

StoreItem.displayName = "StoreItem";

export default StoreItem;
