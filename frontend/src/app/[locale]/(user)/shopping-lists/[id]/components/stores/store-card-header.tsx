import { useId } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import StretchedCollapsibleTrigger from "@/components/custom/common/stretched-collapsible-trigger";
import { CardHeader } from "@/components/ui/card";
import { getChainLabel } from "@/utils/labels";
import { cn } from "@/lib/utils";
import { ChainSummary } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/store-chain-types";
import { IStoreCardMetrics } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/store-card-utils";
import StoreCardBadges from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/store-card-badges";
import StoreCardPriceRow from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/store-card-price-row";
import NearestStoreDistance from "@/components/custom/distance-sort/nearest-store-distance";
import type { INearestStore } from "@/utils/nearest-chain-distance";

interface IStoreCardHeaderProps {
  chain: ChainSummary;
  metrics: IStoreCardMetrics;
  pinnedStoresCount: number;
  hasLowestPriceItem: boolean;
  hasHighestPriceItem: boolean;
  isExpanded: boolean;
  nearest?: INearestStore;
}

export default function StoreCardHeader({
  chain,
  metrics,
  pinnedStoresCount,
  hasLowestPriceItem,
  hasHighestPriceItem,
  isExpanded,
  nearest,
}: IStoreCardHeaderProps) {
  const t = useTranslations("shoppingListDetail");
  const id = useId();

  const {
    isPreferred,
    isDataFromToday,
    storeMinPrice,
    storeAvgPrice,
    storeMaxPrice,
    totalItemsInList,
    hasAllItems,
    minExtreme,
    avgExtreme,
    maxExtreme,
  } = metrics;

  const describedBy = [
    `${id}-extremes`,
    `${id}-badges`,
    `${id}-prices`,
    nearest && `${id}-nearest`,
    `${id}-action`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // The toggle stretches over the header instead of wrapping it, so the opening badge can be its own button.
    <CardHeader className="relative isolate flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-4">
        <div
          className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm"
          aria-hidden="true"
        >
          <StoreChainLogo
            chain={chain.chain}
            className={cn(
              "object-contain w-full h-full",
              !isPreferred && pinnedStoresCount > 0 && "opacity-40",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-1">
              <span id={`${id}-extremes`} className="contents">
                {hasLowestPriceItem && (
                  <>
                    <ArrowBigDownDash
                      className="size-5 text-green-600 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{t("stores.hasLowest")}</span>
                  </>
                )}
                {hasHighestPriceItem && (
                  <>
                    <ArrowBigUpDash
                      className="size-5 text-red-700 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{t("stores.hasHighest")}</span>
                  </>
                )}
              </span>

              <h3 lang="hr" className="font-semibold text-foreground">
                <StretchedCollapsibleTrigger aria-describedby={describedBy}>
                  {getChainLabel(chain.chain)}
                </StretchedCollapsibleTrigger>
              </h3>
            </div>

            <div id={`${id}-badges`}>
              <StoreCardBadges
                hasAllItems={hasAllItems}
                itemCount={chain.itemCount}
                totalItemsInList={totalItemsInList}
                isDataFromToday={isDataFromToday}
                priceDate={chain.price_date}
              />
            </div>
          </div>

          <div id={`${id}-prices`} className="mt-2">
            <StoreCardPriceRow
              minPrice={storeMinPrice}
              avgPrice={storeAvgPrice}
              maxPrice={storeMaxPrice}
              minExtreme={minExtreme}
              avgExtreme={avgExtreme}
              maxExtreme={maxExtreme}
            />
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
          {t("stores.availability")}
        </p>

        <ChevronDown
          className={cn(
            "size-8 text-gray-500 transition-transform motion-reduce:transition-none flex-shrink-0",
            isExpanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </div>
    </CardHeader>
  );
}
