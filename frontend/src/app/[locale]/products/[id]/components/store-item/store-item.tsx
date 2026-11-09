"use client";

import { memo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, TriangleAlert } from "lucide-react";
import MediaRow from "@/components/custom/common/media-row";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChainLabel } from "@/utils/labels";
import { cn } from "@/lib/utils";
import {
  ChainProductResponse,
  ProductResponse,
  StorePrice,
} from "@/lib/cijene-api/schemas";
import { formatDate } from "@/utils/strings";
import { isPriceDateToday } from "@/utils/product-price-utils";
import { useUser } from "@/context/user-context";
import StorePriceSummary from "@/app/[locale]/products/[id]/components/store-item/store-price-summary";
import StorePricesDetails, {
  type StorePricesStatus,
} from "@/app/[locale]/products/[id]/components/store-item/store-prices-details";
import NearestStoreDistance from "@/components/custom/distance-sort/nearest-store-distance";
import type { INearestStore } from "@/utils/nearest-chain-distance";

interface IStoreItemProps {
  store: ChainProductResponse;
  storePrices: StorePrice[];
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

    const isPreferred =
      accountUser?.pinnedStores?.some((s) => s.storeApiId === store.chain) ||
      false;

    const isDataFromToday = isPriceDateToday(store.price_date);

    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger asChild className="cursor-pointer py-0">
            <button type="button" className="w-full text-left">
              {/* Even padding, so the logo sits as far from the card's edges as from its top and bottom. */}
              <MediaRow
                className="p-3 sm:p-4"
                media={
                  <StoreChainLogo
                    chain={store.chain}
                    className={cn(
                      "rounded-xl object-contain shadow-sm",
                      !isPreferred &&
                        (accountUser?.pinnedStores?.length ?? 0) > 0 &&
                        "opacity-40",
                    )}
                  />
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {getChainLabel(store.chain)}
                      </h3>

                      <div className="flex items-center gap-3">
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

                    <div className="mt-2">
                      <StorePriceSummary store={store} product={product} />
                    </div>

                    {nearest && (
                      <div className="mt-1">
                        <NearestStoreDistance nearest={nearest} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-4">
                    <p className="hidden sm:inline text-gray-700 text-sm text-pretty text-right">
                      {t("pricesByLocation")}
                    </p>

                    <ChevronDown
                      className={cn(
                        "size-8 text-gray-500 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </div>
                </div>
              </MediaRow>
            </button>
          </CollapsibleTrigger>

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
