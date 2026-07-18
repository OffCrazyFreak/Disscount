import { ChevronDown, ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";
import StoreChainLogo from "@/components/custom/store-chain-logo";
import { CardHeader } from "@/components/ui/card";
import { getChainLabel } from "@/utils/labels";
import { cn } from "@/lib/utils";
import { ChainSummary } from "@/app/(user)/shopping-lists/[id]/components/stores/store-chain-types";
import { IStoreCardMetrics } from "@/app/(user)/shopping-lists/[id]/components/stores/store-card-utils";
import StoreCardBadges from "@/app/(user)/shopping-lists/[id]/components/stores/store-card-badges";
import StoreCardPriceRow from "@/app/(user)/shopping-lists/[id]/components/stores/store-card-price-row";

interface IStoreCardHeaderProps {
  chain: ChainSummary;
  metrics: IStoreCardMetrics;
  pinnedStoresCount: number;
  hasLowestPriceItem: boolean;
  hasHighestPriceItem: boolean;
  isExpanded: boolean;
}

export default function StoreCardHeader({
  chain,
  metrics,
  pinnedStoresCount,
  hasLowestPriceItem,
  hasHighestPriceItem,
  isExpanded,
}: IStoreCardHeaderProps) {
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

  return (
    <CardHeader className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
          <StoreChainLogo
            chain={chain.chain}
            className={cn(
              "object-contain w-full h-full",
              !isPreferred && pinnedStoresCount > 0 && "opacity-40",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            {hasLowestPriceItem && (
              <ArrowBigDownDash className="size-5 text-green-600 flex-shrink-0" />
            )}
            {hasHighestPriceItem && (
              <ArrowBigUpDash className="size-5 text-red-700 flex-shrink-0" />
            )}

            <h3 className="font-semibold text-gray-900">
              {getChainLabel(chain.chain)}
            </h3>

            <StoreCardBadges
              hasAllItems={hasAllItems}
              itemCount={chain.itemCount}
              totalItemsInList={totalItemsInList}
              isDataFromToday={isDataFromToday}
              priceDate={chain.price_date}
            />
          </div>

          <div className="mt-2">
            <StoreCardPriceRow
              minPrice={storeMinPrice}
              avgPrice={storeAvgPrice}
              maxPrice={storeMaxPrice}
              minExtreme={minExtreme}
              avgExtreme={avgExtreme}
              maxExtreme={maxExtreme}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-4">
        <p className="hidden sm:inline text-gray-700 text-sm text-pretty text-right">
          Dostupnost proizvoda
        </p>

        <ChevronDown
          className={cn(
            "size-8 text-gray-500 transition-transform flex-shrink-0",
            isExpanded && "rotate-180",
          )}
        />
      </div>
    </CardHeader>
  );
}
