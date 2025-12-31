"use client";

import { memo, useState, useCallback } from "react";
import {
  ChevronDown,
  AlertTriangle,
  ArrowBigUpDash,
  ArrowBigDownDash,
} from "lucide-react";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storeNamesMap } from "@/utils/mappings";
import { cn } from "@/lib/utils";
import { ShoppingListDto } from "@/lib/api/types";
import { useUser } from "@/context/user-context";
import { formatDate } from "@/utils/strings";
import { ShoppingListItemsTable } from "./shopping-list-items-table";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";

interface ShoppingListStoreItemProps {
  chain: ChainProductResponse & { itemCount: number };
  shoppingList: ShoppingListDto;
  absoluteMinPrice: number;
  absoluteMaxPrice: number;
  productsData: ProductResponse[];
  completeStoresAnalysis: {
    bestStore: (ChainProductResponse & { itemCount: number }) | null;
    worstStore: (ChainProductResponse & { itemCount: number }) | null;
  };
  hasLowestPriceItem: boolean;
  hasHighestPriceItem: boolean;
}

export const ShoppingListStoreItem = memo(
  ({
    chain,
    shoppingList,
    absoluteMinPrice,
    absoluteMaxPrice,
    productsData,
    completeStoresAnalysis,
    hasLowestPriceItem,
    hasHighestPriceItem,
  }: ShoppingListStoreItemProps) => {
    const { user } = useUser();
    const [expandedStore, setExpandedStore] = useState<string | null>(null);

    const toggleStoreExpansion = useCallback((chainCode: string) => {
      setExpandedStore((prev: string | null) =>
        prev === chainCode ? null : chainCode
      );
    }, []);

    // Check if this store chain is preferred by the user
    const isPreferred =
      user?.pinnedStores?.some((s) => s.storeApiId === chain.chain) || false;

    // Check if data is from today
    const today = new Date().toISOString().split("T")[0];
    const isDataFromToday = chain.price_date === today;

    // Parse prices
    const storeMinPrice = parseFloat(chain.min_price);
    const storeAvgPrice = parseFloat(chain.avg_price);
    const storeMaxPrice = parseFloat(chain.max_price);

    // Check if this store has all items from the shopping list
    const totalItemsInList = shoppingList.items?.length || 0;
    const hasAllItems = chain.itemCount === totalItemsInList;

    // Determine if this store should be highlighted
    const isBestCompleteStore =
      hasAllItems && completeStoresAnalysis.bestStore?.chain === chain.chain;
    const isWorstCompleteStore =
      hasAllItems && completeStoresAnalysis.worstStore?.chain === chain.chain;

    return (
      <Collapsible
        open={expandedStore === chain.chain}
        onOpenChange={() => toggleStoreExpansion(chain.chain)}
      >
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger asChild className="cursor-pointer">
            <CardHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Store Chain Image */}
                <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                  <Image
                    src={`/store-chains/${chain.chain}.png`}
                    alt={storeNamesMap[chain.chain] || chain.chain}
                    width={256}
                    height={256}
                    className={cn(
                      "object-contain w-full h-full",
                      !isPreferred &&
                        (user?.pinnedStores?.length ?? 0) > 0 &&
                        "opacity-40"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Chain Name and Badge */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Price indicators */}
                    {hasLowestPriceItem && (
                      <ArrowBigDownDash className="size-5 text-green-600 flex-shrink-0" />
                    )}
                    {hasHighestPriceItem && (
                      <ArrowBigUpDash className="size-5 text-red-700 flex-shrink-0" />
                    )}

                    <h3 className="font-semibold text-gray-900">
                      {storeNamesMap[chain.chain] || chain.chain}
                    </h3>

                    <div className="flex items-center gap-3">
                      {!hasAllItems && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 border-orange-200"
                        >
                          <AlertTriangle className="size-4 mr-1" />
                          Nedostaju neki proizvodi ({chain.itemCount}/
                          {totalItemsInList})
                        </Badge>
                      )}

                      {!isDataFromToday && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 border-amber-200"
                        >
                          <AlertTriangle className="size-4 mr-1" />
                          Podaci od {formatDate(chain.price_date)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price Information */}
                  <div className="mt-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={cn(
                          hasAllItems && storeMinPrice === absoluteMinPrice
                            ? "text-green-600 font-bold"
                            : hasAllItems && storeMinPrice === absoluteMaxPrice
                            ? "text-red-700 font-bold"
                            : "text-gray-700"
                        )}
                      >
                        Min: {storeMinPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          hasAllItems && storeAvgPrice === absoluteMinPrice
                            ? "text-green-600 font-bold"
                            : hasAllItems && storeAvgPrice === absoluteMaxPrice
                            ? "text-red-700 font-bold"
                            : "text-gray-700"
                        )}
                      >
                        Prosjek: {storeAvgPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          hasAllItems && storeMaxPrice === absoluteMinPrice
                            ? "text-green-600 font-bold"
                            : hasAllItems && storeMaxPrice === absoluteMaxPrice
                            ? "text-red-700 font-bold"
                            : "text-gray-700"
                        )}
                      >
                        Max: {storeMaxPrice.toFixed(2)}€
                      </span>
                    </div>
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
                    expandedStore === chain.chain && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <ShoppingListItemsTable
                chain={chain}
                shoppingList={shoppingList}
                productsData={productsData}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }
);
