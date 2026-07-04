import React, { memo } from "react";
import { useTranslations } from "next-intl";
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
import {
  getMinPrice,
  getMaxPrice,
  getPriceExtreme,
} from "@/app/products/utils/product-utils";
import { useUser } from "@/context/user-context";
import { locationNamesMap } from "@/constants/name-mappings";

interface IStorePricesTableProps {
  storePrices: StorePrice[];
  product: ProductResponse;
}

export const StorePricesTable = memo(
  ({ storePrices, product }: IStorePricesTableProps) => {
    const { user } = useUser();
    const t = useTranslations("productDetail");
    const tCommon = useTranslations("common");

    const productMinPrice = getMinPrice(product);
    const productMaxPrice = getMaxPrice(product);

    if (storePrices.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {t("noChainPrices")}
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">{t("location")}</TableHead>
              <TableHead className="font-bold">{t("address")}</TableHead>
              <TableHead className="font-bold text-center">
                {t("price")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {storePrices
              .sort((a, b) => {
                // Get user's preferred place IDs
                const preferredPlaceIds =
                  user?.pinnedPlaces?.map((place) => place.placeApiId) || [];

                // Check if locations are preferred (using standardized location names)
                const aStandardizedCity = a.store.city
                  ? locationNamesMap[a.store.city] || a.store.city
                  : "";
                const bStandardizedCity = b.store.city
                  ? locationNamesMap[b.store.city] || b.store.city
                  : "";
                const aIsPreferred =
                  preferredPlaceIds.includes(aStandardizedCity);
                const bIsPreferred =
                  preferredPlaceIds.includes(bStandardizedCity);

                // Preferred locations come first
                if (aIsPreferred && !bIsPreferred) return -1;
                if (!aIsPreferred && bIsPreferred) return 1;

                // If both are preferred or both are not, sort by city first, then by address
                const aCityName = a.store.city
                  ? locationNamesMap[a.store.city] || a.store.city
                  : "";
                const bCityName = b.store.city
                  ? locationNamesMap[b.store.city] || b.store.city
                  : "";
                const cityCompare = aCityName.localeCompare(bCityName, "hr", {
                  sensitivity: "base",
                });
                if (cityCompare !== 0) return cityCompare;
                return (a.store.address || "").localeCompare(
                  b.store.address || "",
                  "hr",
                  { sensitivity: "base" },
                );
              })
              .map((price, index) => {
                // Get the best price (prefer special_price, then regular_price)
                const displayPrice = price.special_price
                  ? parseFloat(price.special_price)
                  : price.regular_price
                    ? parseFloat(price.regular_price)
                    : null;

                // Check if this location is preferred (using standardized location names)
                const standardizedCity = price.store.city
                  ? locationNamesMap[price.store.city] || price.store.city
                  : "";
                const isLocationPreferred =
                  user?.pinnedPlaces?.some(
                    (place) => place.placeApiId === standardizedCity,
                  ) || false;

                const priceExtreme =
                  displayPrice != null
                    ? getPriceExtreme(
                        displayPrice,
                        productMinPrice,
                        productMaxPrice,
                      )
                    : null;

                return (
                  <TableRow
                    key={`${price.store.code}-${index}`}
                    className={cn(
                      "text-pretty [&>*]:whitespace-normal",
                      isLocationPreferred ? "text-gray-700" : "text-gray-500",
                    )}
                  >
                    <TableCell>
                      {price.store.city
                        ? locationNamesMap[price.store.city] || price.store.city
                        : tCommon("unknown")}
                    </TableCell>

                    <TableCell>
                      {price.store.address || tCommon("unknown")}
                    </TableCell>

                    <TableCell className="text-center">
                      {displayPrice != null ? (
                        <span
                          className={cn(
                            priceExtreme === "min"
                              ? "text-green-600"
                              : priceExtreme === "max"
                                ? "text-red-700"
                                : isLocationPreferred
                                  ? "text-gray-700"
                                  : "text-gray-500",
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
  },
);

StorePricesTable.displayName = "StorePricesTable";
