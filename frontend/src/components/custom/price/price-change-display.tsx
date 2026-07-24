import { ArrowBigDownDash, ArrowBigUpDash } from "lucide-react";
import { cn } from "@/lib/utils";
import { priceDeltaColorClass } from "@/utils/price";

interface IPriceChangeDisplayProps {
  priceChange: {
    difference: number;
    percentage: number | null;
  } | null;
}

export default function PriceChangeDisplay({
  priceChange,
}: IPriceChangeDisplayProps) {
  if (!priceChange) return null;

  return (
    <h3
      className={cn(
        "text-right flex gap-2 flex-wrap items-center justify-end transition-all",
        priceDeltaColorClass(priceChange.difference),
      )}
    >
      <span>
        {priceChange.difference > 0 && "+"}
        {/* minus is displayed automatically from the number */}
        {priceChange.difference.toFixed(2)}€
      </span>

      {priceChange.percentage !== null && (
        <span>({Math.round(Math.abs(priceChange.percentage))}%)</span>
      )}

      {priceChange.difference !== 0 &&
        (priceChange.difference < 0 ? (
          <ArrowBigDownDash className="hidden sm:inline" />
        ) : (
          <ArrowBigUpDash className="hidden sm:inline" />
        ))}
    </h3>
  );
}
