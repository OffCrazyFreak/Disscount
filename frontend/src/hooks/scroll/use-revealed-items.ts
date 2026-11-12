"use client";

import { useMemo } from "react";

import { splitIntoBatches } from "@/hooks/scroll/reveal-batches";
import useRevealedBatches from "@/hooks/scroll/use-revealed-batches";

const REVEAL_BATCH_SIZE = 50;

export function useRevealedItems<T>(
  items: T[],
  resetKey: string,
  batchSize = REVEAL_BATCH_SIZE,
): T[] {
  const batches = useMemo(
    () => splitIntoBatches(items, batchSize),
    [items, batchSize],
  );

  const batchesToShow = useRevealedBatches(resetKey, batches.length);

  return useMemo(
    () => batches.slice(0, batchesToShow).flat(),
    [batches, batchesToShow],
  );
}
