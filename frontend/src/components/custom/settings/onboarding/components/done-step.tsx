"use client";

import { CircleCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

export default function DoneStep() {
  const t = useTranslations("settings");
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <motion.div
        className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.1 }}
      >
        <CircleCheck className="size-8" />
      </motion.div>

      <div className="space-y-1">
        <p className="font-medium">{t("onboarding.done.title")}</p>
        <p className="text-sm text-muted-foreground text-pretty">
          {t("onboarding.done.text")}
        </p>
      </div>
    </div>
  );
}
