"use client";

import { useEffect, useState } from "react";

import usePageVisible from "@/hooks/use-page-visible";

function msToNextMinute(now: number) {
  return 60_000 - (now % 60_000);
}

/**
 * The current time, refreshed on each minute boundary while the tab is in the
 * foreground and at once when it comes back, so an "open" badge never lags a
 * closing time. Null until mounted, because the server's clock and a
 * visitor's would render different badges.
 */
export function useCurrentMinute(): Date | null {
  const isVisible = usePageVisible();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      setNow(new Date());
      timer = setTimeout(tick, msToNextMinute(Date.now()));
    }

    tick();

    return () => clearTimeout(timer);
  }, [isVisible]);

  return now;
}
