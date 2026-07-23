"use client";

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
  ariaLabel?: string;
  className?: string;
}

// Buttons clamp to min/max, typing does not: the owning form's zod schema ranges it.
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
        size={isSecondary ? "sm" : "icon"}
        variant={isSecondary ? "outline" : "primary"}
        aria-label={`${sign > 0 ? "Povećaj" : "Smanji"} za ${amount}`}
        className={cn(
          "shrink-0 rounded-full text-lg font-bold",
          isSecondary ? "hidden sm:flex size-14" : "size-13",
        )}
        onClick={() => step(sign * amount)}
      >
        {sign > 0 ? "+" : "-"}
        {amount}
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
