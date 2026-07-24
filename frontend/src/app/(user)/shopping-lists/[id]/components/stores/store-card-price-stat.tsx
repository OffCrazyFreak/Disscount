import { PriceExtreme } from "@/app/products/utils/product-utils";

interface IStoreCardPriceStatProps {
  label: string;
  price: number;
  extreme: PriceExtreme;
}

function extremeClass(extreme: PriceExtreme): string {
  return extreme === "min"
    ? "text-green-600 font-bold"
    : extreme === "max"
      ? "text-red-700 font-bold"
      : "text-gray-700";
}

// Colour alone would leave the extreme unreadable to screen readers and in greyscale.
function extremeLabel(extreme: PriceExtreme): string | null {
  return extreme === "min"
    ? "najniža među lancima"
    : extreme === "max"
      ? "najviša među lancima"
      : null;
}

/** One labelled price in a store card's Min / Prosjek / Max row. */
export default function StoreCardPriceStat({
  label,
  price,
  extreme,
}: IStoreCardPriceStatProps) {
  const description = extremeLabel(extreme);

  return (
    <span className={extremeClass(extreme)}>
      {label}: {price.toFixed(2)}€
      {description && <span className="sr-only"> ({description})</span>}
    </span>
  );
}
