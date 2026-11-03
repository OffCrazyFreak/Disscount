import { useEffect, useEffectEvent, useState } from "react";

interface IUnresolvedRetry {
  failureGeneration: number;
  itemIds: readonly string[];
}

/**
 * A retry can end with nothing failed yet not every price loaded, such as a 404, and the
 * retry button then leaves with the banner. Once it has, the retried rows get focus, since
 * they say what happened. Returns the setter for the retry that did not load every price.
 */
export function useRetryFocusHandoff(
  failedCount: number,
  failureGeneration: number,
  onFocusLost: (retriedItemIds: readonly string[]) => void,
) {
  const [unresolvedRetry, setUnresolvedRetry] =
    useState<IUnresolvedRetry | null>(null);
  const handOffFocus = useEffectEvent(onFocusLost);

  useEffect(() => {
    if (
      failedCount === 0 &&
      unresolvedRetry?.failureGeneration === failureGeneration &&
      document.activeElement === document.body
    ) {
      handOffFocus(unresolvedRetry.itemIds);
    }
  }, [failedCount, failureGeneration, unresolvedRetry]);

  return setUnresolvedRetry;
}
