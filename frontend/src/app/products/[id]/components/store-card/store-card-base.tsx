import { memo, useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
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
import {
  ChainProductResponse,
  ProductResponse,
  StorePrice,
} from "@/lib/cijene-api/schemas";
import { getMinPrice, getMaxPrice } from "@/lib/cijene-api/utils/product-utils";
import { formatDate } from "@/utils/strings";
import { useUser } from "@/context/user-context";
import { StoreCardPricesTable } from "./store-card-prices-table";

interface StoreCardProps {
  store: ChainProductResponse;
  storePrices: StorePrice[];
  product: ProductResponse;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const StoreCard = memo(
  ({ isExpanded, onToggle, store, storePrices, product }: StoreCardProps) => {
    const { user } = useUser();

    // Check if this store chain is preferred by the user
    const isPreferred =
      user?.pinnedStores?.some((s) => s.storeApiId === store.chain) || false;

    // Check if data is from today
    const today = new Date().toISOString().split("T")[0];
    const isDataFromToday = store.price_date === today;

    // Parse prices
    const storeMinPrice = parseFloat(store.min_price);
    const storeAvgPrice = parseFloat(store.avg_price);
    const storeMaxPrice = parseFloat(store.max_price);

    const productMinPrice = getMinPrice(product);
    const productMaxPrice = getMaxPrice(product);

    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CollapsibleTrigger asChild className="cursor-pointer">
            <CardHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Store Chain Image */}
                <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                  <Image
                    src={`/store-chains/${store.chain}.png`}
                    alt={storeNamesMap[store.chain] || store.chain}
                    width="256"
                    height="256"
                    className={cn(
                      "object-contain w-full h-full",
                      !isPreferred && "opacity-40"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Chain Name and Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {storeNamesMap[store.chain] || store.chain}
                    </h3>

                    <div className="flex items-center gap-3">
                      {!isDataFromToday && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 border-amber-200"
                        >
                          <AlertTriangle className="size-4 mr-1" />
                          Podaci od {formatDate(store.price_date)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price Information */}
                  <div className="mt-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={cn(
                          storeMinPrice === productMaxPrice
                            ? "text-red-700 font-bolder"
                            : storeMinPrice === productMinPrice
                            ? "text-green-700 font-bolder"
                            : "text-gray-700"
                        )}
                      >
                        Min: {storeMinPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          storeAvgPrice === productMaxPrice
                            ? "text-red-700 font-bolder"
                            : storeAvgPrice === productMinPrice
                            ? "text-green-700 font-bolder"
                            : "text-gray-700"
                        )}
                      >
                        Prosjek: {storeAvgPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          storeMaxPrice === productMaxPrice
                            ? "text-red-700 font-bolder"
                            : storeMaxPrice === productMinPrice
                            ? "text-green-700 font-bolder"
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
                  Cijene po lokacijama
                </p>

                <ChevronDown
                  className={cn(
                    "size-8 text-gray-500 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <StoreCardPricesTable
                storePrices={storePrices}
                product={product}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }
);
