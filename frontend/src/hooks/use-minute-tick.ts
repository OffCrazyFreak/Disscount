"use client";

import { useEffect, useState } from "react";

// Returns false until mounted, so a Date.now()-based render never mismatches the server.
export function useMinuteTick(): boolean {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    // Not derivable, because the server cannot agree with a Date.now()-based label, so the first client render matches and only then ticks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const intervalId = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return mounted;
}
