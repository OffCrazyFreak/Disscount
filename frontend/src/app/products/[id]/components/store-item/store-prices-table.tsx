import { memo } from "react";
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
import { getLocationLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

interface IStorePricesTableProps {
  storePrices: StorePrice[];
  product: ProductResponse;
}

const StorePricesTable = memo(
  ({ storePrices, product }: IStorePricesTableProps) => {
    const { user } = useUser();

    const productMinPrice = getMinPrice(product);
    const productMaxPrice = getMaxPrice(product);

    // Pinned places are stored under the standardized city name, so the
    // display label doubles as the lookup key.
    const preferredPlaceIds =
      user?.pinnedPlaces?.map((place) => place.placeApiId) || [];

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
              <TableHead className="font-bold text-center">Cijena</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {[...storePrices]
              .sort((a, b) => {
                const aCity = getLocationLabel(a.store.city);
                const bCity = getLocationLabel(b.store.city);

                // Pinned locations come first, then city, then address
                const aIsPreferred = preferredPlaceIds.includes(aCity);
                const bIsPreferred = preferredPlaceIds.includes(bCity);

                if (aIsPreferred !== bIsPreferred) return aIsPreferred ? -1 : 1;

                return (
                  compareHr(aCity, bCity) ||
                  compareHr(a.store.address || "", b.store.address || "")
                );
              })
              .map((price, index) => {
                // Get the best price (prefer special_price, then regular_price)
                const displayPrice = price.special_price
                  ? parseFloat(price.special_price)
                  : price.regular_price
                    ? parseFloat(price.regular_price)
                    : null;

                const isLocationPreferred = preferredPlaceIds.includes(
                  getLocationLabel(price.store.city),
                );

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
                      {getLocationLabel(price.store.city, "Nepoznato")}
                    </TableCell>

                    <TableCell>{price.store.address || "Nepoznato"}</TableCell>

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

export default StorePricesTable;
