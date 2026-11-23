"use client";

import { RefObject, useEffect, useState } from "react";

/** A virtualizer clamps scrolling to sizes it knows, so CSS padding leaves the last rows under the nav. */
export function useNavClearance(probeRef: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;

    // The variable changes with the breakpoint and the safe area, both resizes.
    const observer = new ResizeObserver(() => setHeight(probe.offsetHeight));
    observer.observe(probe);

    return () => observer.disconnect();
  }, [probeRef]);

  return height;
}
