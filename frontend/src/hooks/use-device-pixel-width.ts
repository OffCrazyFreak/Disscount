"use client";

import { useEffect, useRef, useState } from "react";

export interface IDevicePixelBox {
  width: number;
  /** Null unless a height source was asked for. */
  height: number | null;
  dpr: number;
}

type HeightSource = "none" | "self" | "parent";

function contentBox(element: HTMLElement) {
  const style = getComputedStyle(element);

  return {
    width:
      element.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight),
    height:
      element.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom),
  };
}

/**
 * Content box of the ref'd element in CSS px, with the pixel ratio it was measured at.
 * Height is opt-in because an element sized by its own content would feed back into it:
 * `self` suits a box with a fixed height, `parent` a box that fills a fixed-size parent.
 */
export function useDevicePixelWidth<T extends HTMLElement>(
  heightSource: HeightSource = "none",
) {
  const ref = useRef<T>(null);
  const [measured, setMeasured] = useState<IDevicePixelBox | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const heightElement =
      heightSource === "parent" ? element.parentElement : element;

    function measure() {
      if (!element) return;

      setMeasured({
        width: contentBox(element).width,
        height:
          heightSource !== "none" && heightElement
            ? contentBox(heightElement).height
            : null,
        dpr: window.devicePixelRatio || 1,
      });
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (heightSource === "parent" && heightElement) {
      observer.observe(heightElement);
    }
    // Browser zoom changes the ratio without always resizing the box.
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [heightSource]);

  return { ref, measured };
}
