"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StepperNumberInput } from "@/components/ui/stepper-number-input";
import { WatchType } from "@/lib/api";
import type { WatchlistItemDto } from "@/lib/api/schemas/watchlist";
import {
  WatchlistFormData,
  watchlistLimits,
} from "@/app/products/typings/watchlist-form";

function thresholdSteps(watchType: WatchType, minPrice: number) {
  if (watchType === WatchType.percentage) return { primary: 5, secondary: 10 };
  if (minPrice < 10) return { primary: 0.5, secondary: 1 };
  return { primary: 2, secondary: 5 };
}

interface IWatchlistThresholdInputProps {
  minPrice: number;
  existingItemForType?: WatchlistItemDto;
}

export default function WatchlistThresholdInput({
  minPrice,
  existingItemForType,
}: IWatchlistThresholdInputProps) {
  const form = useFormContext<WatchlistFormData>();
  const watchType = form.watch("watchType");
  const rawValue = form.watch("thresholdValue");

  const { min, max } = watchlistLimits(watchType);
  const steps = thresholdSteps(watchType, minPrice);
  const current = Number.parseFloat(rawValue);

  return (
    <FormField
      control={form.control}
      name="thresholdValue"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Minimalno sniženje{" "}
            {watchType === WatchType.absolute ? "(€)" : "(%)"}:
          </FormLabel>

          <FormControl>
            <StepperNumberInput
              value={field.value}
              onChange={field.onChange}
              steps={steps}
              min={min}
              max={max}
              integer={watchType === WatchType.percentage}
              placeholder={
                watchType === WatchType.absolute ? "Npr. 12" : "Npr. 15"
              }
              ariaLabel="Prag sniženja"
            />
          </FormControl>

          {existingItemForType &&
            existingItemForType.thresholdValue !== current && (
              <FormDescription className="text-xs">
                Minimalan prag će biti ažuriran s{" "}
                {existingItemForType.thresholdValue} na {rawValue}.
              </FormDescription>
            )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
