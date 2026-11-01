"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@/context/user-context";
import { useWatchlistPriceDropCount } from "@/lib/watchlist/use-watchlist-price-drop-count";

interface ISettledCount {
  userId: string | undefined;
  count: number;
}

/**
 * Announces the Praćenje count when it changes without a navigation. Mounted once in the
 * layout, outside the nav surfaces, because a changed aria-label is never announced and
 * a region inside each surface would announce twice wherever two are on screen.
 */
export default function PriceDropStatus() {
  const t = useTranslations("shell");
  const { user } = useUser();
  const { count, isSettled } = useWatchlistPriceDropCount();
  const [settled, setSettled] = useState<ISettledCount | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // The first settled count per account is what loading produced, not a change, so only
  // later ones speak; a cold start or a sign-in would otherwise talk over the page.
  if (settled && settled.userId !== user?.id) {
    setSettled(null);
    setIsAnnouncing(false);
  } else if (isSettled && settled?.count !== count) {
    setIsAnnouncing(settled !== null);
    setSettled({ userId: user?.id, count });
  }

  return (
    <div role="status" className="sr-only">
      {isAnnouncing &&
        settled !== null &&
        settled.count > 0 &&
        t("nav.watchlistPriceDrops", {
          label: t("nav.watchlistShort"),
          count: settled.count,
        })}
    </div>
  );
}
