import { z } from "zod";

import {
  parseThreshold,
  watchlistLimits,
} from "@/app/[locale]/products/utils/watchlist-thresholds";

import { WatchType } from "@/lib/api";

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
        message: "products.validation.thresholdInvalid",
      });
      return;
    }

    // The range messages state 1 to 99 and 0.1 to 999 themselves; keep them equal to watchlistLimits.
    const { min, max } = watchlistLimits(data.watchType);
    if (value < min || value > max) {
      ctx.addIssue({
        code: "custom",
        path: [path],
        message:
          data.watchType === WatchType.percentage
            ? "products.validation.percentageRange"
            : "products.validation.absoluteRange",
      });
    }
  });

export type WatchlistFormData = z.infer<typeof watchlistFormSchema>;
