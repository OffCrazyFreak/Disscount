import { ArrowBigUpDash } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceChangeDisplayProps {
  priceChange: {
    difference: number;
    percentage: number;
  } | null;
}

export default function PriceChangeDisplay({
  priceChange,
}: PriceChangeDisplayProps) {
  if (!priceChange) return null;

  return (
    <h3
      className={cn(
        "text-right flex gap-2 flex-wrap items-center justify-end transition-all",
        {
          "text-red-700": priceChange.difference > 0,
          "text-green-700": priceChange.difference < 0,
          "text-gray-700": priceChange.difference === 0,
        }
      )}
    >
      <span>
        {priceChange.difference > 0 && "+"}
        {priceChange.difference}€
      </span>

      <span>({priceChange.percentage}%)</span>
      {priceChange.difference !== 0 && (
        <ArrowBigUpDash
          className={cn("hidden sm:inline", {
            "rotate-180": priceChange.difference < 0,
          })}
        />
      )}
    </h3>
  );
}
