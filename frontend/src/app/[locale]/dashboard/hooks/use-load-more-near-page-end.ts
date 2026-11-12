"use client";

import { useCallback, useEffect } from "react";

import { useOnNearPageEnd } from "@/hooks/scroll/use-on-near-page-end";
import { isNearPageEnd } from "@/utils/scroll";

interface IInfiniteList {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => Promise<unknown>;
}

/** Loads the next page as the reader scrolls near the end, and while the shown rows are too few to scroll. */
export function useLoadMoreNearPageEnd(
  list: IInfiniteList,
  shownCount: number,
) {
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = list;

  const loadNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
  const canLoadNextPage = hasNextPage && !isFetchingNextPage;

  useOnNearPageEnd(loadNextPage, canLoadNextPage);

  // After a failed page it waits for a scroll, so a broken backend is never called in a loop.
  useEffect(() => {
    if (canLoadNextPage && !isFetchNextPageError && isNearPageEnd()) {
      loadNextPage();
    }
  }, [canLoadNextPage, isFetchNextPageError, loadNextPage, shownCount]);
}
