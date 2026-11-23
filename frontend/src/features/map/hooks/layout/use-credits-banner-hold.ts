"use client";

import { useEffect, useState } from "react";

import { useInstallBannerHold } from "@/components/custom/pwa/install-banner-hold";

/** Lifted when the map's credits fold, since the licences need them in sight first. */
export const CREDITS_BANNER_HOLD = "map-credits";

// A map that never loads never folds its credits, so the banner must not wait for it for ever.
const GIVE_UP_MS = 15_000;

/** Holds the install banner from the map page's first render, before the map's own code has even loaded. */
export function useCreditsBannerHold() {
  const [hasGivenUp, setHasGivenUp] = useState(false);

  useInstallBannerHold(CREDITS_BANNER_HOLD, !hasGivenUp);

  useEffect(() => {
    const timer = window.setTimeout(() => setHasGivenUp(true), GIVE_UP_MS);

    return () => window.clearTimeout(timer);
  }, []);
}
