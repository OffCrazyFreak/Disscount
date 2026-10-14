import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { StorePrice } from "@/lib/cijene-api/schemas";
import {
  getPriceExtreme,
  type PriceExtreme,
} from "@/app/[locale]/products/utils/product-utils";
import { formatPrice } from "@/utils/price";

// Prefer the special price over the regular one
function getDisplayPrice(price: StorePrice): number | null {
  if (price.special_price) return parseFloat(price.special_price);
  if (price.regular_price) return parseFloat(price.regular_price);

  return null;
}

function priceClass(extreme: PriceExtreme, isLocationPreferred: boolean) {
  if (extreme === "min") return "text-green-600";
  if (extreme === "max") return "text-red-700";

  return isLocationPreferred ? "text-gray-700" : "text-gray-500";
}

interface IStorePriceCellProps {
  price: StorePrice;
  isLocationPreferred: boolean;
  productMinPrice: number | null;
  productMaxPrice: number | null;
}

export default function StorePriceCell({
  price,
  isLocationPreferred,
  productMinPrice,
  productMaxPrice,
}: IStorePriceCellProps) {
  const t = useTranslations("productDetail.pricesTable");
  const locale = useLocale();
  const displayPrice = getDisplayPrice(price);

  if (displayPrice == null) return t("notAvailable");

  const priceExtreme = getPriceExtreme(
    displayPrice,
    productMinPrice,
    productMaxPrice,
  );

  return (
    <span className={cn(priceClass(priceExtreme, isLocationPreferred))}>
      {formatPrice(displayPrice, locale)}
      {/* {price.special_price && (
        <span className="ml-2">(akcija)</span>
      )} */}
    </span>
  );
}
