import { z } from "zod";

import { parseThreshold } from "@/app/products/utils/watchlist-thresholds";

import { WatchType } from "@/lib/api";

export function watchlistLimits(watchType: WatchType) {
  return watchType === WatchType.absolute
    ? { min: 0.1, max: 999, unit: "€" }
    : { min: 1, max: 99, unit: "%" };
}

// One field per mode, not one shared field: the two numbers mean different things
// and are saved as separate watchlist entries, so switching modes has to keep an
// in-progress edit of the other one instead of overwriting it.
export function thresholdField(
  watchType: WatchType,
): "percentageValue" | "absoluteValue" {
  return watchType === WatchType.absolute ? "absoluteValue" : "percentageValue";
}

// Strings in form state for free typing; the schema owns parsing and range.
export const watchlistFormSchema = z
  .object({
    watchType: z.enum(WatchType),
    percentageValue: z.string(),
    absoluteValue: z.string(),
  })
  .superRefine((data, ctx) => {
    // Only the selected mode is submitted, so an unfinished number left in the
    // other one must not hold the form invalid.
    const path = thresholdField(data.watchType);
    const value = parseThreshold(data[path]);

    if (!Number.isFinite(value)) {
      ctx.addIssue({
        code: "custom",
        path: [path],
        message: "Unesi valjanu vrijednost",
      });
      return;
    }

    const { min, max, unit } = watchlistLimits(data.watchType);
    if (value < min || value > max) {
      ctx.addIssue({
        code: "custom",
        path: [path],
        message:
          data.watchType === WatchType.percentage
            ? `Postotak mora biti između ${min}% i ${max}%`
            : `Iznos mora biti između ${min}${unit} i ${max}${unit}`,
      });
    }
  });

export type WatchlistFormData = z.infer<typeof watchlistFormSchema>;
