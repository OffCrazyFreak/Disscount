"use client";

import { RefObject, useEffect, useState } from "react";

/** An element's height in pixels, kept current as it resizes. */
export function useOffsetHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return height;
}
