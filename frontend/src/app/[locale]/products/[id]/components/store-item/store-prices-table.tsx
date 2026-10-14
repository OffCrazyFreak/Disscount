import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductResponse, StorePrice } from "@/lib/cijene-api/schemas";
import {
  getMinPrice,
  getMaxPrice,
} from "@/app/[locale]/products/utils/product-utils";
import { useUser } from "@/context/user-context";
import { getLocationLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";
import StorePriceRow from "@/app/[locale]/products/[id]/components/store-item/store-price-row";

interface IStorePricesTableProps {
  storePrices: StorePrice[];
  product: ProductResponse;
}

const StorePricesTable = memo(
  ({ storePrices, product }: IStorePricesTableProps) => {
    const t = useTranslations("productDetail.pricesTable");
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
              .map((price, index) => (
                <StorePriceRow
                  key={`${price.store.code}-${index}`}
                  price={price}
                  isLocationPreferred={preferredPlaceIds.includes(
                    getLocationLabel(price.store.city),
                  )}
                  productMinPrice={productMinPrice}
                  productMaxPrice={productMaxPrice}
                />
              ))}
          </TableBody>
        </Table>
      </div>
    );
  },
);

StorePricesTable.displayName = "StorePricesTable";

export default StorePricesTable;
