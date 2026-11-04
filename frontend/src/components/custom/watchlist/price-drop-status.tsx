"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@/context/user-context";
import { useWatchlistPriceDropCount } from "@/lib/watchlist/use-watchlist-price-drop-count";

interface ISettledCount {
  userId: string | undefined;
  count: number;
}

/** Mounted once in the layout because a changed aria-label is never announced, and a region per nav surface would announce twice. */
export default function PriceDropStatus() {
  const t = useTranslations("shell");
  const { user } = useUser();
  const { count, isSettled } = useWatchlistPriceDropCount();
  const [settled, setSettled] = useState<ISettledCount | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // The first settled count per account comes from loading, not a change, so only later ones speak.
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
