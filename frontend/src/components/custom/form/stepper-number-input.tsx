"use client";

import { Minus, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IStepPair {
  primary: number;
  secondary: number;
}

interface IStepperNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  steps: IStepPair;
  min: number;
  max: number;
  integer?: boolean;
  placeholder?: string;
  /**
   * Only for a field with no visible label. aria-label replaces the accessible name
   * rather than adding to it, so passing one alongside a FormLabel gives the control a
   * name that shares no words with the text beside it, and speaking the visible label
   * then fails to reach the field.
   */
  ariaLabel?: string;
  className?: string;
}

function formatStepAmount(amount: number) {
  const value = `${amount}`;

  return value.startsWith("0.") ? value.slice(1) : value;
}

// Buttons clamp to min/max; typing may be empty or out of range, and the owning
// form's zod schema ranges it and blocks an invalid submission.
export function StepperNumberInput({
  value,
  onChange,
  steps,
  min,
  max,
  integer = false,
  placeholder,
  ariaLabel,
  className,
}: IStepperNumberInputProps) {
  const parsed = Number.parseFloat(value);
  const current = Number.isFinite(parsed) ? parsed : 0;

  function step(delta: number) {
    const next = Math.min(max, Math.max(min, current + delta));
    onChange(integer ? `${Math.round(next)}` : `${Number(next.toFixed(2))}`);
  }

  function renderStep(amount: number, sign: 1 | -1) {
    const isSecondary = amount === steps.secondary;

    return (
      <Button
        type="button"
        size="icon"
        variant={isSecondary ? "outline" : "primary"}
        // Announced the way Croatian writes it, so the spoken label matches the
        // visible one rather than reading a dot-decimal the button never shows.
        aria-label={`${sign > 0 ? "Povećaj" : "Smanji"} za ${amount.toLocaleString("hr-HR")}`}
        className={cn(
          "shrink-0 rounded-full text-lg font-bold",
          isSecondary
            ? "hidden size-14 sm:flex sm:size-14"
            : "size-13 sm:size-10",
        )}
        onClick={() => step(sign * amount)}
      >
        {amount === 1 ? (
          sign > 0 ? (
            <Plus />
          ) : (
            <Minus />
          )
        ) : (
          <>
            {sign > 0 ? "+" : "-"}
            {formatStepAmount(amount)}
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 mx-auto my-2", className)}>
      {renderStep(steps.secondary, -1)}
      {renderStep(steps.primary, -1)}

      <Input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className="text-center w-20 sm:w-40"
      />

      {renderStep(steps.primary, 1)}
      {renderStep(steps.secondary, 1)}
    </div>
  );
}
