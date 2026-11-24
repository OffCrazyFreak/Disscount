"use client";

import { useEffect, useState } from "react";

// Returns false until mounted, so a Date.now()-based render never mismatches the server.
export function useMinuteTick(): boolean {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    // The server cannot match a Date.now() label, so the first client render matches, then ticks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const intervalId = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return mounted;
}
