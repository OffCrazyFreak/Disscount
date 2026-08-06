"use client";

import { useEffect, useState } from "react";

// Re-renders every minute so relative-time labels stay current. Returns false
// until mounted, so a Date.now()-based render never mismatches the server.
export function useMinuteTick(): boolean {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    // The mount gate cannot be derived: the server has no way to agree with a
    // Date.now()-based label, so the first client render has to match the server's
    // and only then start ticking.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const intervalId = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return mounted;
}
