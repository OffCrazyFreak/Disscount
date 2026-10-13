"use client";

import { Sun, X } from "lucide-react";

import { useBrightnessHintDismissed } from "@/app/(user)/digital-cards/hooks/use-brightness-hint-dismissed";

interface IBrightnessHintProps {
  /** True when the screen cannot be kept awake, so the person has to do it. */
  mayDim: boolean;
}

export default function BrightnessHint({ mayDim }: IBrightnessHintProps) {
  const [dismissed, dismiss] = useBrightnessHintDismissed();

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3 text-sm">
      <Sun
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-amber-600"
      />

      <p className="flex-1">
        Povećaj svjetlinu ekrana da se kod lakše očita.
        {mayDim && " Ekran se može sam ugasiti, pa ga dotakni prije blagajne."}
      </p>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Ne prikazuj više savjet o svjetlini"
        className="-m-1 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
