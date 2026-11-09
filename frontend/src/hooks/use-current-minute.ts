"use client";

import { useEffect, useState } from "react";

import usePageVisible from "@/hooks/use-page-visible";

function msToNextMinute(now: number) {
  return 60_000 - (now % 60_000);
}

/** Null until mounted, because the server's clock and a visitor's would render different badges. */
export function useCurrentMinute({
  enabled = true,
}: { enabled?: boolean } = {}): Date | null {
  const isVisible = usePageVisible();
  const [now, setNow] = useState<Date | null>(null);
  const isTicking = enabled && isVisible;

  useEffect(() => {
    if (!isTicking) return;

    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      setNow(new Date());
      timer = setTimeout(tick, msToNextMinute(Date.now()));
    }

    tick();

    return () => clearTimeout(timer);
  }, [isTicking]);

  return now;
}
