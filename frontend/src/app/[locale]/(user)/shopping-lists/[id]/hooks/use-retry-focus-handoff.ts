import { useEffect, useEffectEvent, useRef, useState } from "react";

interface IUnresolvedRetry {
  failureGeneration: number;
  itemIds: readonly string[];
}

/**
 * A retry can end with nothing failed yet not every price loaded, such as a 404, and the
 * retry button then leaves with the banner. If it took focus with it, the retried rows get
 * focus, since they say what happened. Returns the setter for the retry that did not load
 * every price, and the retry button's ref.
 */
export function useRetryFocusHandoff(
  failedCount: number,
  failureGeneration: number,
  onFocusLost: (retriedItemIds: readonly string[]) => void,
) {
  const [unresolvedRetry, setUnresolvedRetry] =
    useState<IUnresolvedRetry | null>(null);
  const handOffFocus = useEffectEvent(onFocusLost);
  const buttonLostFocusRef = useRef(false);

  useEffect(() => {
    if (
      failedCount === 0 &&
      unresolvedRetry?.failureGeneration === failureGeneration &&
      buttonLostFocusRef.current &&
      document.activeElement === document.body
    ) {
      buttonLostFocusRef.current = false;
      handOffFocus(unresolvedRetry.itemIds);
    }
  }, [failedCount, failureGeneration, unresolvedRetry]);

  function rememberFocusOnUnmount(button: HTMLButtonElement) {
    buttonLostFocusRef.current = false;

    return () => {
      buttonLostFocusRef.current = document.activeElement === button;
    };
  }

  return { setUnresolvedRetry, retryButtonRef: rememberFocusOnUnmount };
}
