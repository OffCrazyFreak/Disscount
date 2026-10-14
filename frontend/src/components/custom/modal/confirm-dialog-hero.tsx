"use client";

import { type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface IConfirmDialogHeroProps {
  icon: LucideIcon;
  isDestructive: boolean;
}

export default function ConfirmDialogHero({
  icon: Icon,
  isDestructive,
}: IConfirmDialogHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="relative flex size-14 items-center justify-center"
    >
      {/* Concentric halo rings that ground the icon and set the tone. */}
      <span
        className={cn(
          "absolute inset-0 rounded-full",
          isDestructive ? "bg-destructive/10" : "bg-amber-500/10",
        )}
      />
      <span
        className={cn(
          "absolute inset-1.5 rounded-full",
          isDestructive ? "bg-destructive/15" : "bg-amber-500/15",
        )}
      />
      <Icon
        className={cn(
          "relative size-6",
          isDestructive ? "text-destructive" : "text-amber-600",
        )}
        strokeWidth={2.2}
      />
    </motion.div>
  );
}
