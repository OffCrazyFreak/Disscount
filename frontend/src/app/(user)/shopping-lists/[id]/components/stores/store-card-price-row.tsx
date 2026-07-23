import { cn } from "@/lib/utils";
import { PriceExtreme } from "@/app/products/utils/product-utils";

interface IStoreCardPriceRowProps {
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  minExtreme: PriceExtreme;
  avgExtreme: PriceExtreme;
  maxExtreme: PriceExtreme;
}

function extremeClass(extreme: PriceExtreme): string {
  return extreme === "min"
    ? "text-green-600 font-bold"
    : extreme === "max"
      ? "text-red-700 font-bold"
      : "text-gray-700";
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
      <span className={cn(extremeClass(minExtreme))}>
        Min: {minPrice.toFixed(2)}€
      </span>
      <span className={cn(extremeClass(avgExtreme))}>
        Prosjek: {avgPrice.toFixed(2)}€
      </span>
      <span className={cn(extremeClass(maxExtreme))}>
        Max: {maxPrice.toFixed(2)}€
      </span>
    </div>
  );
}
