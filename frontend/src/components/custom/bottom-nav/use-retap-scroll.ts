"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { scrollWindowTo } from "@/utils/scroll";

interface IReturnPoint {
  pathname: string;
  y: number;
}

/**
 * Re-tapping the active tab goes to the top, and a second tap comes back. The
 * saved point carries its pathname, so it expires on navigation without an
 * effect: a position from one route means nothing on the next.
 */
export default function useRetapScroll() {
  const pathname = usePathname();
  const [returnPoint, setReturnPoint] = useState<IReturnPoint | null>(null);

  const returnY =
    returnPoint && returnPoint.pathname === pathname ? returnPoint.y : null;

  function retap() {
    if (returnY !== null) {
      setReturnPoint(null);
      scrollWindowTo(returnY);
      return;
    }

    setReturnPoint({ pathname, y: window.scrollY });
    scrollWindowTo(0);
  }

  return { retap, canReturn: returnY !== null };
}
