"use client";

import { useEffect, useState } from "react";

interface IElementSize {
  width: number;
  height: number;
}

/** An element's size in pixels, kept current as it resizes; zero while it is not mounted. */
export function useElementSize(element: HTMLElement | null): IElementSize {
  const [size, setSize] = useState<IElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(() =>
      setSize({ width: element.offsetWidth, height: element.offsetHeight }),
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return element ? size : { width: 0, height: 0 };
}
