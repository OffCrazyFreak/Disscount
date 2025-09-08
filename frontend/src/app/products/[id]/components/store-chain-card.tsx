import React, { memo, useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface StoreChainCardProps {
  chain: ChainProductResponse;
  storePrices: StorePrice[];
  product: ProductResponse;
}

export const StoreChainCard = memo(
  ({ chain, storePrices, product }: StoreChainCardProps) => {
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
                          minPrice === productMinPrice
                            ? "text-green-700 font-bolder"
                            : "text-gray-700"
                        )}
                      >
                        Min: {minPrice.toFixed(2)}€
                      </span>
                      <span className="text-gray-700 font-medium">
                        Prosjek: {avgPrice.toFixed(2)}€
                      </span>
                      <span
                        className={cn(
                          maxPrice === productMaxPrice
                            ? "text-red-700 font-bolder"
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
              {storePrices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nema dostupnih cijena za ovaj lanac
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Lokacija</TableHead>
                        <TableHead className="font-bold">Adresa</TableHead>
                        <TableHead className="font-bold">Cijena</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storePrices
                        .sort((a, b) => {
                          // Get user's preferred place IDs
                          const preferredPlaceIds =
                            user?.pinnedPlaces?.map(
                              (place) => place.placeApiId
                            ) || [];

                          // Check if locations are preferred
                          const aIsPreferred = preferredPlaceIds.includes(
                            a.store.city || ""
                          );
                          const bIsPreferred = preferredPlaceIds.includes(
                            b.store.city || ""
                          );

                          // Preferred locations come first
                          if (aIsPreferred && !bIsPreferred) return -1;
                          if (!aIsPreferred && bIsPreferred) return 1;

                          // If both are preferred or both are not, sort by city first, then by address
                          const cityCompare = (a.store.city || "").localeCompare(
                            b.store.city || "",
                            "hr",
                            { sensitivity: "base" }
                          );
                          if (cityCompare !== 0) return cityCompare;
                          return (a.store.address || "").localeCompare(
                            b.store.address || "",
                            "hr",
                            { sensitivity: "base" }
                          );
                        })
                        .map((price, index) => {
                          // Get the best price (prefer special_price, then regular_price)
                          const displayPrice = price.special_price
                            ? parseFloat(price.special_price)
                            : price.regular_price
                            ? parseFloat(price.regular_price)
                            : null;

                          // Check if this location is preferred
                          const isLocationPreferred =
                            user?.pinnedPlaces?.some(
                              (place) =>
                                place.placeApiId === (price.store.city || "")
                            ) || false;

                          return (
                            <TableRow key={`${price.store.code}-${index}`}>
                              <TableCell
                                className={cn(
                                  isLocationPreferred
                                    ? "text-gray-700"
                                    : "text-gray-500"
                                )}
                              >
                                {price.store.city || "Nepoznato"}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  isLocationPreferred
                                    ? "text-gray-700"
                                    : "text-gray-500"
                                )}
                              >
                                {price.store.address || "Nepoznato"}
                              </TableCell>
                              <TableCell className="text-gray-700 font-medium">
                                {displayPrice ? (
                                  <span
                                    className={cn(
                                      displayPrice === productMinPrice
                                        ? "text-green-600"
                                        : displayPrice === productMaxPrice
                                        ? "text-red-700"
                                        : isLocationPreferred
                                        ? "text-gray-700"
                                        : "text-gray-500"
                                    )}
                                  >
                                    {displayPrice.toFixed(2)}€
                                    {price.special_price && (
                                      <span className="text-xs text-green-600 ml-1">
                                        (akcija)
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }
);

StoreChainCard.displayName = "StoreChainCard";
