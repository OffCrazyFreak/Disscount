"use client";

import { useEffect, useState } from "react";
import {
  getNextBatchState,
  getVisibleBatchCount,
} from "@/app/[locale]/products/utils/product-batches";

function isNearPageEnd(): boolean {
  const scrollY = window.scrollY || window.pageYOffset;
  const viewport = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;

  return scrollY + viewport >= fullHeight - 10000;
}

/** A background price refresh may change the items, but must not collapse batches the user already revealed for the same key. */
export default function useRevealedBatches(
  batchKey: string,
  batchCount: number,
): number {
  const [batchState, setBatchState] = useState({
    key: batchKey,
    count: batchCount > 0 ? 1 : 0,
  });
  const batchesToShow = getVisibleBatchCount(batchState, batchKey, batchCount);

  useEffect(() => {
    if (batchesToShow >= batchCount) return;

    const onScroll = () => {
      if (!isNearPageEnd()) return;

      setBatchState((previous) =>
        getNextBatchState(previous, batchKey, batchCount),
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [batchKey, batchesToShow, batchCount]);

  return batchesToShow;
}
