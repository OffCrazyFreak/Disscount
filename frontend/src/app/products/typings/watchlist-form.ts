import { z } from "zod";

import { WatchType } from "@/lib/api";

export function watchlistLimits(watchType: WatchType) {
  return watchType === WatchType.absolute
    ? { min: 0.1, max: 999, unit: "€" }
    : { min: 1, max: 99, unit: "%" };
}

// thresholdValue stays a string in form state (it feeds a free-typing number
// input and the +/- steppers); the schema owns parsing and range rules.
export const watchlistFormSchema = z
  .object({
    watchType: z.enum(WatchType),
    thresholdValue: z.string(),
  })
  .superRefine((data, ctx) => {
    const value = Number.parseFloat(data.thresholdValue);

    if (!Number.isFinite(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["thresholdValue"],
        message: "Unesi valjanu vrijednost",
      });
      return;
    }

    const { min, max, unit } = watchlistLimits(data.watchType);
    if (value < min || value > max) {
      ctx.addIssue({
        code: "custom",
        path: ["thresholdValue"],
        message:
          data.watchType === WatchType.percentage
            ? `Postotak mora biti između ${min}% i ${max}%`
            : `Iznos mora biti između ${min}${unit} i ${max}${unit}`,
      });
    }
  });

export type WatchlistFormData = z.infer<typeof watchlistFormSchema>;
