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
import { StepperNumberInput } from "@/components/custom/form/stepper-number-input";
import { Skeleton } from "@/components/ui/skeleton";
import { WatchType } from "@/lib/api";
import type { WatchlistItemDto } from "@/lib/api/schemas/watchlist";
import {
  thresholdField,
  WatchlistFormData,
  watchlistLimits,
} from "@/app/products/typings/watchlist-form";

function thresholdSteps(watchType: WatchType, minPrice: number) {
  if (watchType === WatchType.percentage) return { primary: 5, secondary: 10 };
  if (minPrice < 10) return { primary: 0.5, secondary: 2 };
  return { primary: 1, secondary: 5 };
}

interface IWatchlistThresholdInputProps {
  minPrice: number;
  existingItemForType?: WatchlistItemDto;
  // The tracked threshold is still being fetched, so any number shown now would be
  // a guess that changes under the user a moment later.
  loading?: boolean;
}

export default function WatchlistThresholdInput({
  minPrice,
  existingItemForType,
  loading = false,
}: IWatchlistThresholdInputProps) {
  const form = useFormContext<WatchlistFormData>();
  const watchType = form.watch("watchType");
  // Each mode keeps its own number, so this renders whichever one is selected.
  const name = thresholdField(watchType);
  const rawValue = form.watch(name);

  const { min, max } = watchlistLimits(watchType);
  const steps = thresholdSteps(watchType, minPrice);
  const current = Number.parseFloat(rawValue);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Minimalno sniženje{" "}
            {watchType === WatchType.absolute ? "(€)" : "(%)"}:
          </FormLabel>

          <FormControl>
            {loading ? (
              <Skeleton className="my-2 h-14 w-full" />
            ) : (
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
            )}
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
