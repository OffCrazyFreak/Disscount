import { PriceExtreme } from "@/app/products/utils/product-utils";
import StoreCardPriceStat from "@/app/(user)/shopping-lists/[id]/components/stores/store-card-price-stat";

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
  return (
    <div className="flex items-center gap-4 text-sm">
      <StoreCardPriceStat label="Min" price={minPrice} extreme={minExtreme} />
      <StoreCardPriceStat
        label="Prosjek"
        price={avgPrice}
        extreme={avgExtreme}
      />
      <StoreCardPriceStat label="Max" price={maxPrice} extreme={maxExtreme} />
    </div>
  );
}
