import { WatchType } from "@/lib/api";
import type { WatchlistItemDto } from "@/lib/api/schemas/watchlist";
import { watchlistLimits } from "@/app/products/typings/watchlist-form";

const PERCENTAGE_SUGGESTION = "10";
const PRICE_FALLBACK = 1;

export interface IThresholdBaselines {
  percentageValue: string;
  absoluteValue: string;
}

function findItem(items: WatchlistItemDto[], watchType: WatchType) {
  return items.find((item) => item.watchType === watchType);
}

// Compared as numbers so retyping 1 as 1.0 is not a change, and as text while
// either side is not a number yet, which covers the half-typed and empty cases.
export function isSameThreshold(value: string, baseline: string): boolean {
  const left = Number.parseFloat(value);
  const right = Number.parseFloat(baseline);

  return Number.isFinite(left) && Number.isFinite(right)
    ? left === right
    : value === baseline;
}

/**
 * What each mode's field reverts to: the threshold already being tracked, or a
 * suggestion when this product is not tracked that way yet. These are the form's
 * default values, so "changed" means "differs from one of these", which is what
 * the reset button and the unsaved marker read.
 */
export function thresholdBaselines(
  items: WatchlistItemDto[],
  avgPrice: number,
): IThresholdBaselines {
  // A tenth off the average price, so the suggestion sits near a real discount.
  // With no price data to go on, 1€ keeps the field filled and the form savable.
  const tenth =
    avgPrice > 0 ? Math.round(avgPrice * 0.1 * 100) / 100 : PRICE_FALLBACK;

  // Clamped to what the schema accepts: a tenth off anything under 1€ lands below
  // the 0.1€ minimum, which would open the modal already invalid, with the save
  // button dead and no message explaining why until the field is touched.
  const { min, max } = watchlistLimits(WatchType.absolute);
  const suggested = Math.min(max, Math.max(min, tenth));

  return {
    percentageValue:
      findItem(items, WatchType.percentage)?.thresholdValue.toString() ??
      PERCENTAGE_SUGGESTION,
    absoluteValue:
      findItem(items, WatchType.absolute)?.thresholdValue.toString() ??
      suggested.toString(),
  };
}
