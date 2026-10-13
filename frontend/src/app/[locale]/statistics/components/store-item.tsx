"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, MapPin, Tag } from "lucide-react";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getChainLabel, getLocationLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";
import { cn } from "@/lib/utils";
import cijeneService from "@/lib/cijene-api";
import { ChainStats } from "@/lib/cijene-api/schemas";

const SEPARATOR = "|";

interface IStoreItemProps {
  stat: ChainStats;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

// Memoized component for individual chain items to prevent unnecessary re-renders
const StoreItem = memo(
  ({ stat, isExpanded, onToggle, isLast }: IStoreItemProps) => {
    const t = useTranslations("statistics");

    // Fetch stores for this specific chain when the item is rendered
    const { data: storesData, isLoading: storesLoading } =
      cijeneService.useListStoresByChain(stat.chain_code);

    return (
      <div>
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full text-left">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                  <StoreChainLogo
                    chain={stat.chain_code}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 lang="hr" className="font-semibold text-foreground">
                        {getChainLabel(stat.chain_code)}
                      </h3>

                      <p className="text-sm text-gray-600 flex items-center gap-2 sm:gap-4 flex-wrap my-2">
                        <span className="flex items-center gap-2">
                          <MapPin className="size-5 mb-1" />
                          {t("storeItem.storeCount", {
                            count: stat.store_count,
                          })}
                        </span>
                        <span className="hidden sm:inline">{SEPARATOR}</span>
                        <span className="flex items-center gap-2">
                          <Tag className="size-5 mb-1" />
                          {t("storeItem.priceCount", {
                            count: stat.price_count,
                          })}
                        </span>
                      </p>
                    </div>

                    <div>
                      <ChevronDown
                        className={cn(
                          "size-8 text-gray-500 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-4">
              {storesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <BlockLoadingSpinner size={24} className="mr-2" />
                  {t("storeItem.loadingStores")}
                </div>
              ) : storesData?.stores && storesData.stores.length > 0 ? (
                <div className="max-h-128 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">
                          {t("storeItem.city")}
                        </TableHead>
                        <TableHead className="font-bold">
                          {t("storeItem.address")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {[...storesData.stores]
                        .sort((a, b) =>
                          compareHr(
                            getLocationLabel(a.city),
                            getLocationLabel(b.city),
                          ),
                        )
                        .map((store) => (
                          <TableRow key={store.address}>
                            <TableCell
                              lang={store.city ? "hr" : undefined}
                              className="text-gray-700"
                            >
                              {getLocationLabel(
                                store.city,
                                t("storeItem.unknown"),
                              )}
                            </TableCell>
                            <TableCell
                              lang={store.address ? "hr" : undefined}
                              className="text-gray-700"
                            >
                              {store.address || t("storeItem.unknown")}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t("storeItem.noStores")}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!isLast && <Separator className="my-4" />}
      </div>
    );
  },
);

StoreItem.displayName = "StoreItem";

export default StoreItem;
