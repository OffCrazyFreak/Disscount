import React, { memo, useState } from "react";
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
  chain: ChainProductResponse;
  storePrices: StorePrice[];
  product: ProductResponse;
}

export const StoreCard = memo(
  ({ chain, storePrices, product }: StoreCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useUser();

    // Check if this store chain is preferred by the user
    const isPreferred =
      user?.pinnedStores?.some((store) => store.storeApiId === chain.chain) ||
      false;

    // Check if data is from today
    const today = new Date().toISOString().split("T")[0];
    const isDataFromToday = chain.price_date === today;

    // Parse prices
    const minPrice = parseFloat(chain.min_price);
    const avgPrice = parseFloat(chain.avg_price);
    const maxPrice = parseFloat(chain.max_price);

    const productMinPrice = getMinPrice(product);
    const productMaxPrice = getMaxPrice(product);

    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                {/* Store Chain Image */}
                <div className="flex-shrink-0 size-16 rounded-sm overflow-hidden shadow-sm">
                  <Image
                    src={`/store-chains/${chain.chain}.png`}
                    alt={storeNamesMap[chain.chain] || chain.chain}
                    width="256"
                    height="256"
                    className={cn(
                      "object-contain w-full h-full",
                      !isPreferred && "opacity-40"
                    )}
                  />
                </div>

                {/* Chain Name and Badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {storeNamesMap[chain.chain] || chain.chain}
                      </h3>
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

                    {/* Chevron */}
                    <ChevronDown
                      className={cn(
                        "size-6 text-gray-500 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>

                  {/* Price Information */}
                  <div className="mt-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={cn(
                          minPrice === productMaxPrice
                            ? "text-red-700 font-bolder"
                            : minPrice === productMinPrice
                            ? "text-green-700 font-bolder"
                            : "text-gray-700"
                        )}
                      >
                        Min: {minPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          avgPrice === productMaxPrice
                            ? "text-red-700 font-bolder"
                            : avgPrice === productMinPrice
                            ? "text-green-700 font-bolder"
                            : "text-gray-700"
                        )}
                      >
                        Prosjek: {avgPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          maxPrice === productMaxPrice
                            ? "text-red-700 font-bolder"
                            : maxPrice === productMinPrice
                            ? "text-green-700 font-bolder"
                            : "text-gray-700"
                        )}
                      >
                        Max: {maxPrice.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
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
