import { useLocale, useTranslations } from "next-intl";
import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  getMinPrice,
  getMaxPrice,
  getPriceExtreme,
  type PriceExtreme,
} from "@/features/products/utils/product-utils";
import { formatPrice } from "@/utils/price/price";

const EXTREME_CLASS: Record<NonNullable<PriceExtreme>, string> = {
  max: "text-red-700 font-bold",
  min: "text-green-700 font-bold",
};

function extremeClass(extreme: PriceExtreme): string {
  return extreme ? EXTREME_CLASS[extreme] : "text-gray-700";
}

interface IStorePriceSummaryProps {
  store: ChainProductResponse;
  product: ProductResponse;
}

export default function StorePriceSummary({
  store,
  product,
}: IStorePriceSummaryProps) {
  const t = useTranslations("productDetail.storeItem");
  const locale = useLocale();

  const productMinPrice = getMinPrice(product);
  const productMaxPrice = getMaxPrice(product);

  const stats = [
    { key: "min", price: store.min_price },
    { key: "average", price: store.avg_price },
    { key: "max", price: store.max_price },
  ] as const;

  return (
    <div className="flex items-center gap-4 text-sm">
      {stats.map(({ key, price }) => (
        <span
          key={key}
          className={extremeClass(
            getPriceExtreme(price, productMinPrice, productMaxPrice),
          )}
        >
          {t(key, { price: formatPrice(price, locale) })}
        </span>
      ))}
    </div>
  );
}
