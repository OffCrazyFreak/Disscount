"use client";

import { memo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, TriangleAlert } from "lucide-react";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import StorePricesTable from "@/app/[locale]/products/[id]/components/store-item/store-prices-table";
import { TIME_ZONE } from "@/i18n/formatting";

interface IStoreItemProps {
  store: ChainProductResponse;
  storePrices: StorePrice[];
  product: ProductResponse;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const StoreItem = memo(
  ({ isExpanded, onToggle, store, storePrices, product }: IStoreItemProps) => {
    const t = useTranslations("productDetail.storeItem");
    const locale = useLocale();
    const { user } = useUser();

    // Check if this store chain is preferred by the user
    const isPreferred =
      user?.pinnedStores?.some((s) => s.storeApiId === store.chain) || false;

    // Check if data is from today
    // price_date is a Croatian calendar date; en-CA formats as YYYY-MM-DD.
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
    }).format(new Date());
    const isDataFromToday = store.price_date === today;

    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger asChild className="cursor-pointer">
            <button type="button" className="w-full text-left">
              <CardHeader className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Store Chain Image */}
                  <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                    <StoreChainLogo
                      chain={store.chain}
                      className={cn(
                        "object-contain w-full h-full",
                        !isPreferred &&
                          (user?.pinnedStores?.length ?? 0) > 0 &&
                          "opacity-40",
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Chain Name and Badge */}
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

                    {/* Price Information */}
                    <div className="mt-2">
                      <StorePriceSummary store={store} product={product} />
                    </div>
                  </div>
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
              </CardHeader>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent>
              <StorePricesTable storePrices={storePrices} product={product} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  },
);

StoreItem.displayName = "StoreItem";

export default StoreItem;
