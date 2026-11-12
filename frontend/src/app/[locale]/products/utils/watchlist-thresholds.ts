import { WatchType } from "@/lib/api";
import type { WatchlistItemDto } from "@/lib/api/schemas/watchlist";

export function watchlistLimits(watchType: WatchType) {
  return watchType === WatchType.absolute
    ? { min: 0.1, max: 999, unit: "€" }
    : { min: 1, max: 99, unit: "%" };
}

const PERCENTAGE_SUGGESTION = "10";
const PRICE_FALLBACK = 1;

export interface IThresholdBaselines {
  percentageValue: string;
  absoluteValue: string;
}

function findItem(items: WatchlistItemDto[], watchType: WatchType) {
  return items.find((item) => item.watchType === watchType);
}

/** Whole string or nothing, because parseFloat reads "10abc" as 10, hiding a real edit. */
export function parseThreshold(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

// Compared as numbers so retyping 1 as 1.0 is no change, and as text while either side is not a number yet.
export function isSameThreshold(value: string, baseline: string): boolean {
  const left = parseThreshold(value);
  const right = parseThreshold(baseline);

  return Number.isFinite(left) && Number.isFinite(right)
    ? left === right
    : value === baseline;
}

/** These are the form's defaults, which the reset button and unsaved marker compare against. */
export function thresholdBaselines(
  items: WatchlistItemDto[],
  avgPrice: number,
): IThresholdBaselines {
  // A tenth off sits near a real discount; with no price data, 1€ keeps the form savable.
  const tenth =
    avgPrice > 0 ? Math.round(avgPrice * 0.1 * 100) / 100 : PRICE_FALLBACK;

  // Clamped because a tenth off under 1€ falls below the 0.1€ minimum, opening the modal invalid.
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
