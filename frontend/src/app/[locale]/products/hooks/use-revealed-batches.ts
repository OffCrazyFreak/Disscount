"use client";

import { useCallback, useState } from "react";

import { useOnNearPageEnd } from "@/hooks/scroll/use-on-near-page-end";
import {
  getNextBatchState,
  getVisibleBatchCount,
} from "@/app/[locale]/products/utils/product-batches";

/** A background price refresh must not collapse batches already revealed for the same key. */
export default function useRevealedBatches(
  batchKey: string,
  batchCount: number,
): number {
  const [batchState, setBatchState] = useState({
    key: batchKey,
    count: batchCount > 0 ? 1 : 0,
  });
  const batchesToShow = getVisibleBatchCount(batchState, batchKey, batchCount);

  const revealNextBatch = useCallback(() => {
    setBatchState((previous) =>
      getNextBatchState(previous, batchKey, batchCount),
    );
  }, [batchKey, batchCount]);

  useOnNearPageEnd(revealNextBatch, batchesToShow < batchCount);

  return batchesToShow;
}
