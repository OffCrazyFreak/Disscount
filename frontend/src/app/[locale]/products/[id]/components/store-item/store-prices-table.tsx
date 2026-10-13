import { memo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";
import { ProductResponse, StorePrice } from "@/lib/cijene-api/schemas";
import {
  getMinPrice,
  getMaxPrice,
  getPriceExtreme,
} from "@/app/[locale]/products/utils/product-utils";
import { useUser } from "@/context/user-context";
import { getLocationLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";
import { formatPrice } from "@/utils/price";

interface IStorePricesTableProps {
  storePrices: StorePrice[];
  product: ProductResponse;
}

const StorePricesTable = memo(
  ({ storePrices, product }: IStorePricesTableProps) => {
    const t = useTranslations("productDetail.pricesTable");
    const locale = useLocale();
    const { user } = useUser();

    const productMinPrice = getMinPrice(product);
    const productMaxPrice = getMaxPrice(product);

    // Pinned places key off the standardized city name, so label is lookup key.
    const preferredPlaceIds =
      user?.pinnedPlaces?.map((place) => place.placeApiId) || [];

    if (storePrices.length === 0) {
      return <div className="text-center py-8 text-gray-500">{t("empty")}</div>;
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
                    <TableCell lang={price.store.city ? "hr" : undefined}>
                      {getLocationLabel(price.store.city, t("unknown"))}
                    </TableCell>

                    <TableCell lang={price.store.address ? "hr" : undefined}>
                      <Link
                        href={`/map?store=${encodeURIComponent(toStoreKey(price.chain, price.store.code))}`}
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            effect: "hoverUnderline",
                          }),
                          "h-auto justify-start gap-1.5 whitespace-normal px-0 py-1 text-left font-normal text-inherit hover:bg-transparent",
                        )}
                      >
                        {price.store.address || t("unknown")}
                        <SquareArrowOutUpRight
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{t("showOnMap")}</span>
                      </Link>
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
                          {formatPrice(displayPrice, locale)}
                          {/* {price.special_price && (
                            <span className="ml-2">(akcija)</span>
                          )} */}
                        </span>
                      ) : (
                        t("notAvailable")
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
