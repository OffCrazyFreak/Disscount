"use client";

import { memo } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
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
import {
  ChainProductResponse,
  ProductResponse,
  StorePrice,
} from "@/lib/cijene-api/schemas";
import {
  getMinPrice,
  getMaxPrice,
  getPriceExtreme,
} from "@/app/products/utils/product-utils";
import { formatDate } from "@/utils/strings";
import { useUser } from "@/context/user-context";
import StorePricesTable from "@/app/products/[id]/components/store-item/store-prices-table";

interface IStoreItemProps {
  store: ChainProductResponse;
  storePrices: StorePrice[];
  product: ProductResponse;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const StoreItem = memo(
  ({ isExpanded, onToggle, store, storePrices, product }: IStoreItemProps) => {
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

    const minExtreme = getPriceExtreme(
      storeMinPrice,
      productMinPrice,
      productMaxPrice,
    );
    const avgExtreme = getPriceExtreme(
      storeAvgPrice,
      productMinPrice,
      productMaxPrice,
    );
    const maxExtreme = getPriceExtreme(
      storeMaxPrice,
      productMinPrice,
      productMaxPrice,
    );

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
                      <h3 className="font-semibold text-gray-900">
                        {getChainLabel(store.chain)}
                      </h3>

                      <div className="flex items-center gap-3">
                        {!isDataFromToday && (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 border-amber-200"
                          >
                            <TriangleAlert className="size-4 mr-1" />
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
                            minExtreme === "max"
                              ? "text-red-700 font-bold"
                              : minExtreme === "min"
                                ? "text-green-700 font-bold"
                                : "text-gray-700",
                          )}
                        >
                          Min: {storeMinPrice.toFixed(2)}€
                        </span>
                        <span
                          className={cn(
                            avgExtreme === "max"
                              ? "text-red-700 font-bold"
                              : avgExtreme === "min"
                                ? "text-green-700 font-bold"
                                : "text-gray-700",
                          )}
                        >
                          Prosjek: {storeAvgPrice.toFixed(2)}€
                        </span>
                        <span
                          className={cn(
                            maxExtreme === "max"
                              ? "text-red-700 font-bold"
                              : maxExtreme === "min"
                                ? "text-green-700 font-bold"
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
                    Cijene po lokacijama
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
