"use client";

import { Sun, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useBrightnessHintDismissed } from "@/app/[locale]/(user)/digital-cards/hooks/use-brightness-hint-dismissed";

interface IBrightnessHintProps {
  /** True when the screen cannot be kept awake, so the person has to do it. */
  mayDim: boolean;
}

export default function BrightnessHint({ mayDim }: IBrightnessHintProps) {
  const t = useTranslations("digitalCards");
  const [dismissed, dismiss] = useBrightnessHintDismissed();

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3 text-sm">
      <Sun
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-amber-600"
      />

      <p className="flex-1">
        {t(mayDim ? "view.brightness.hintMayDim" : "view.brightness.hint")}
      </p>

      <button
        type="button"
        onClick={dismiss}
        aria-label={t("view.brightness.dismiss")}
        className="-m-1 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
