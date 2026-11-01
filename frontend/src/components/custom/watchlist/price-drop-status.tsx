"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWatchlistPriceDropCount } from "@/lib/watchlist/use-watchlist-price-drop-count";

/**
 * Announces the Praćenje count when it changes without a navigation. Mounted once in the
 * layout, outside the nav surfaces, because a changed aria-label is never announced and
 * a region inside each surface would announce twice wherever two are on screen.
 */
export default function PriceDropStatus() {
  const t = useTranslations("shell");
  const { count, isSettled } = useWatchlistPriceDropCount();
  const [settledCount, setSettledCount] = useState<number | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // The first settled count is what loading the app produced, not a change, so only
  // later ones speak; a cold start would otherwise talk over the page's own announcement.
  if (isSettled && count !== settledCount) {
    setIsAnnouncing(settledCount !== null);
    setSettledCount(count);
  }

  return (
    <div role="status" className="sr-only">
      {isAnnouncing &&
        count > 0 &&
        t("nav.watchlistPriceDrops", {
          label: t("nav.watchlistShort"),
          count,
        })}
    </div>
  );
}
