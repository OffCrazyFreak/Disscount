"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import {
  BOTTOM_NAV_VARIANTS,
  DEFAULT_BOTTOM_NAV_VARIANT,
  nextBottomNavVariant,
  readBottomNavVariant,
  writeBottomNavVariant,
  type TBottomNavVariant,
} from "@/components/custom/bottom-nav/bottom-nav-variant";

/**
 * Cycles the bar's surface while the three are being compared.
 *
 * Development only, so it never reaches a production bundle. On a real phone
 * against a deployed build, use `?nav=pill|flat|glass` instead, which the same
 * resolver honours. Reloading applies the choice, since the bar reads the
 * variant once on mount.
 */
export default function BottomNavVariantSwitcher() {
  const [variant, setVariant] = useState<TBottomNavVariant>(
    DEFAULT_BOTTOM_NAV_VARIANT,
  );

  useEffect(() => setVariant(readBottomNavVariant()), []);

  if (process.env.NODE_ENV !== "development") return null;

  function cycle() {
    const next = nextBottomNavVariant(variant);

    setVariant(next);
    writeBottomNavVariant(next);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Stil navigacije: ${variant}`}
      className="bg-foreground/85 text-background fixed top-2 left-2 z-[70] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.6rem] font-medium shadow-lg md:hidden"
    >
      <Layers className="size-[0.85rem]" />
      {variant} {BOTTOM_NAV_VARIANTS.indexOf(variant) + 1}/
      {BOTTOM_NAV_VARIANTS.length}
    </button>
  );
}
