"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface IWizardProgressDotsProps {
  count: number;
  current: number;
}

export default function WizardProgressDots({
  count,
  current,
}: IWizardProgressDotsProps) {
  const t = useTranslations("settings");
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={current + 1}
      aria-label={t("onboarding.progress", {
        current: current + 1,
        total: count,
      })}
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
              index < current && "bg-primary/50",
            )}
          />
        );
      })}
    </div>
  );
}
