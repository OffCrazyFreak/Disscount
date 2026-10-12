import { useTranslations } from "next-intl";
import { PriceExtreme } from "@/app/[locale]/products/utils/product-utils";
import StoreCardPriceStat from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/store-card-price-stat";

interface IStoreCardPriceRowProps {
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  minExtreme: PriceExtreme;
  avgExtreme: PriceExtreme;
  maxExtreme: PriceExtreme;
}

export default function StoreCardPriceRow({
  minPrice,
  avgPrice,
  maxPrice,
  minExtreme,
  avgExtreme,
  maxExtreme,
}: IStoreCardPriceRowProps) {
  const t = useTranslations("shoppingListDetail");

  return (
    <div className="flex items-center gap-4 text-sm">
      <StoreCardPriceStat
        label={t("stores.min")}
        price={minPrice}
        extreme={minExtreme}
      />
      <StoreCardPriceStat
        label={t("stores.avg")}
        price={avgPrice}
        extreme={avgExtreme}
      />
      <StoreCardPriceStat
        label={t("stores.max")}
        price={maxPrice}
        extreme={maxExtreme}
      />
    </div>
  );
}
