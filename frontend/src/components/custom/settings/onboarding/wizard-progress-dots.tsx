"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface IWizardProgressDotsProps {
  count: number;
  current: number;
}

export function WizardProgressDots({ count, current }: IWizardProgressDotsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={current + 1}
      aria-label={`Korak ${current + 1} od ${count}`}
    >
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === current;
        return (
          <motion.span
            key={index}
            layout={!reduceMotion}
            className={cn(
              "h-1.5 rounded-full transition-colors",
              isActive ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
              index < current && "bg-primary/50"
            )}
          />
        );
      })}
    </div>
  );
}
