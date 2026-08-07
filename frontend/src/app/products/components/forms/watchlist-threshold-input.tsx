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
import { parseThreshold } from "@/app/products/utils/watchlist-thresholds";

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
  const current = parseThreshold(rawValue);

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

          {/* The skeleton sits outside FormControl on purpose. FormControl is a Slot
              that injects the field id, aria-describedby and aria-invalid onto its
              child, so wrapping a plain div made the label point at a non-labelable
              element for the length of the fetch. */}
          {loading ? (
            <div role="status" aria-live="polite" className="my-2">
              <Skeleton aria-hidden="true" className="h-14 w-full" />
              <span className="sr-only">Učitavanje praga sniženja</span>
            </div>
          ) : (
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
              />
            </FormControl>
          )}

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
