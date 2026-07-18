"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

interface WatchlistThresholdInputProps {
  minPrice: number;
  existingItemForType?: WatchlistItemDto;
}

export function WatchlistThresholdInput({
  minPrice,
  existingItemForType,
}: WatchlistThresholdInputProps) {
  const form = useFormContext<WatchlistFormData>();
  const watchType = form.watch("watchType");
  const rawValue = form.watch("thresholdValue");

  const { min, max } = watchlistLimits(watchType);
  const steps = thresholdSteps(watchType, minPrice);

  const parsed = Number.parseFloat(rawValue);
  const currentValue = Number.isFinite(parsed)
    ? parsed
    : watchType === WatchType.percentage
      ? 10
      : 0;

  function updateBy(delta: number) {
    const nextValue = Math.min(max, Math.max(min, currentValue + delta));
    const formatted =
      watchType === WatchType.percentage
        ? `${Math.round(nextValue)}`
        : nextValue.toFixed(2);
    form.setValue("thresholdValue", formatted, { shouldDirty: true });
  }

  function StepButton({ step, sign }: { step: number; sign: 1 | -1 }) {
    const isSecondary = step === steps.secondary;
    const next = currentValue + sign * step;

    return (
      <Button
        type="button"
        size={isSecondary ? "sm" : "icon"}
        variant={isSecondary ? "outline" : "default"}
        aria-label={`${sign > 0 ? "Povećaj" : "Smanji"} prag za ${step}`}
        className={
          isSecondary
            ? "hidden sm:flex size-14 rounded-full shrink-0 text-lg font-bold"
            : "size-13 rounded-full shrink-0 text-lg font-bold"
        }
        onClick={() => updateBy(sign * step)}
        disabled={sign > 0 ? next > max : next < min}
      >
        {sign > 0 ? "+" : "-"}
        {step}
      </Button>
    );
  }

  return (
    <FormField
      control={form.control}
      name="thresholdValue"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Minimalno sniženje {watchType === WatchType.absolute ? "(€)" : "(%)"}
            :
          </FormLabel>

          <FormControl>
            <div className="flex items-center gap-4 mx-auto my-2">
              <StepButton step={steps.secondary} sign={-1} />
              <StepButton step={steps.primary} sign={-1} />

              <Input
                {...field}
                type="number"
                step={watchType === WatchType.absolute ? 0.5 : 5}
                min={min}
                max={max}
                placeholder={
                  watchType === WatchType.absolute ? "Npr. 12€" : "Npr. 15%"
                }
                className="text-center w-20 sm:w-40"
              />

              <StepButton step={steps.primary} sign={1} />
              <StepButton step={steps.secondary} sign={1} />
            </div>
          </FormControl>

          {existingItemForType &&
            existingItemForType.thresholdValue !== currentValue && (
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
