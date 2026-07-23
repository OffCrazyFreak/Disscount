"use client";

import { useEffect, useState } from "react";

// Re-renders every minute so relative-time labels stay current. Returns false
// until mounted, so a Date.now()-based render never mismatches the server.
export function useMinuteTick(): boolean {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);

    const intervalId = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return mounted;
}
