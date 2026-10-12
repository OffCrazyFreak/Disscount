"use client";

import { useEffect, useRef, useState } from "react";

interface IDevicePixelWidth {
  width: number;
  dpr: number;
}

/** Content width of the ref'd element in CSS px, with the pixel ratio it was measured at. */
export function useDevicePixelWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [measured, setMeasured] = useState<IDevicePixelWidth | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function measure() {
      if (!element) return;

      const style = getComputedStyle(element);
      const padding =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);

      setMeasured({
        width: element.clientWidth - padding,
        dpr: window.devicePixelRatio || 1,
      });
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    // Browser zoom changes the ratio without always resizing the box.
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { ref, measured };
}
