import React, { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ProductResponse, StorePrice } from "@/lib/cijene-api/schemas";
import { getMinPrice, getMaxPrice } from "@/lib/cijene-api/utils/product-utils";
import { useUser } from "@/context/user-context";

interface StoreCardPricesTableProps {
  storePrices: StorePrice[];
  product: ProductResponse;
}

export const StoreCardPricesTable = memo(
  ({ storePrices, product }: StoreCardPricesTableProps) => {
    const { user } = useUser();

    const productMinPrice = getMinPrice(product);
    const productMaxPrice = getMaxPrice(product);

    if (storePrices.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nema dostupnih cijena za ovaj lanac
        </div>
      );
    }

    return (
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
                  user?.pinnedPlaces?.map((place) => place.placeApiId) || [];

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
                    (place) => place.placeApiId === (price.store.city || "")
                  ) || false;

                return (
                  <TableRow key={`${price.store.code}-${index}`}>
                    <TableCell
                      className={cn(
                        isLocationPreferred ? "text-gray-700" : "text-gray-500"
                      )}
                    >
                      {price.store.city || "Nepoznato"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        isLocationPreferred ? "text-gray-700" : "text-gray-500"
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
                          {/* {price.special_price && (
                            <span className="ml-2">(akcija)</span>
                          )} */}
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
    );
  }
);

StoreCardPricesTable.displayName = "StorePricesTable";
