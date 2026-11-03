"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Turns true once the element comes within `rootMargin` of the viewport, and
 * stays true, so heavy data below the fold loads just before it is needed.
 */
export function useNearViewport<TElement extends Element>(
  rootMargin = "600px 0px",
) {
  const ref = useRef<TElement>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (isNear || !element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setIsNear(true);
      },
      { rootMargin },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [isNear, rootMargin]);

  return [ref, isNear] as const;
}
