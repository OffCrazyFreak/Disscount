import { cn } from "@/lib/utils";

export function formatPriceDelta(
  difference: number,
  percentage: number,
): string {
  return `${difference > 0 ? "+" : ""}${difference.toFixed(2)}€ (${Math.round(Math.abs(percentage))}%)`;
}

export function priceDeltaColorClass(difference: number | null): string {
  return cn({
    "text-red-700": (difference ?? 0) > 0,
    "text-green-700": (difference ?? 0) < 0,
    "text-gray-700": (difference ?? 0) === 0,
  });
}
