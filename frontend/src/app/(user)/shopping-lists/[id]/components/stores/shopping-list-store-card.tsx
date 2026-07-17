"use client";

import { memo, useState, useCallback } from "react";
import {
  ChevronDown,
  TriangleAlert,
  ArrowBigUpDash,
  ArrowBigDownDash,
} from "lucide-react";
import StoreChainLogo from "@/components/custom/store-chain-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChainLabel } from "@/utils/labels";
import { cn } from "@/lib/utils";
import { ShoppingListDto } from "@/lib/api/types";
import { useUser } from "@/context/user-context";
import { formatDate } from "@/utils/strings";
import { ShoppingListItemsTable } from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-items-table";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { getPriceExtreme } from "@/app/products/utils/product-utils";

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

const ShoppingListStoreItemComponent = ({
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
      prev === chainCode ? null : chainCode,
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

  // Store metrics are computed over not-yet-bought items, so compare coverage
  // against the count of items still to buy (checked-off items are excluded).
  const totalItemsInList =
    shoppingList.items?.filter((item) => !item.isChecked).length || 0;
  const hasAllItems = chain.itemCount === totalItemsInList;

  // Only color the totals when this store covers every item, so the comparison
  // against the absolute min/max range is meaningful.
  const minExtreme = hasAllItems
    ? getPriceExtreme(storeMinPrice, absoluteMinPrice, absoluteMaxPrice)
    : null;
  const avgExtreme = hasAllItems
    ? getPriceExtreme(storeAvgPrice, absoluteMinPrice, absoluteMaxPrice)
    : null;
  const maxExtreme = hasAllItems
    ? getPriceExtreme(storeMaxPrice, absoluteMinPrice, absoluteMaxPrice)
    : null;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow py-0">
      <Collapsible
        open={expandedStore === chain.chain}
        onOpenChange={() => toggleStoreExpansion(chain.chain)}
      >
        <CollapsibleTrigger asChild className="cursor-pointer">
          <button type="button" className="w-full text-left">
            <CardHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Store Chain Image */}
                <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                  <StoreChainLogo
                    chain={chain.chain}
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
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Price indicators */}
                    {hasLowestPriceItem && (
                      <ArrowBigDownDash className="size-5 text-green-600 flex-shrink-0" />
                    )}
                    {hasHighestPriceItem && (
                      <ArrowBigUpDash className="size-5 text-red-700 flex-shrink-0" />
                    )}

                    <h3 className="font-semibold text-gray-900">
                      {getChainLabel(chain.chain)}
                    </h3>

                    <div className="flex items-center gap-3">
                      {!hasAllItems && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 border-orange-200"
                        >
                          <TriangleAlert className="size-4 mr-1" />
                          Dostupno proizvoda {chain.itemCount}/
                          {totalItemsInList}
                        </Badge>
                      )}

                      {!isDataFromToday && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 border-amber-200"
                        >
                          <TriangleAlert className="size-4 mr-1" />
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
                          minExtreme === "min"
                            ? "text-green-600 font-bold"
                            : minExtreme === "max"
                              ? "text-red-700 font-bold"
                              : "text-gray-700",
                        )}
                      >
                        Min: {storeMinPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          avgExtreme === "min"
                            ? "text-green-600 font-bold"
                            : avgExtreme === "max"
                              ? "text-red-700 font-bold"
                              : "text-gray-700",
                        )}
                      >
                        Prosjek: {storeAvgPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          maxExtreme === "min"
                            ? "text-green-600 font-bold"
                            : maxExtreme === "max"
                              ? "text-red-700 font-bold"
                              : "text-gray-700",
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
                    expandedStore === chain.chain && "rotate-180",
                  )}
                />
              </div>
            </CardHeader>
          </button>
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
      </Collapsible>
    </Card>
  );
};

ShoppingListStoreItemComponent.displayName = "ShoppingListStoreItem";
export const ShoppingListStoreItem = memo(ShoppingListStoreItemComponent);
