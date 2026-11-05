export interface IBatchState {
  key: string;
  count: number;
}

export function splitIntoBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function initialBatchCount(batchCount: number): number {
  return batchCount > 0 ? 1 : 0;
}

// A new search or filter starts over at the first batch.
export function getVisibleBatchCount(
  state: IBatchState,
  key: string,
  batchCount: number,
): number {
  if (state.key !== key) return initialBatchCount(batchCount);
  if (batchCount === 0) return 0;

  return Math.max(1, Math.min(state.count, batchCount));
}

export function getNextBatchState(
  previous: IBatchState,
  key: string,
  batchCount: number,
): IBatchState {
  const current =
    previous.key === key ? previous.count : initialBatchCount(batchCount);

  return { key, count: Math.min(current + 1, batchCount) };
}
