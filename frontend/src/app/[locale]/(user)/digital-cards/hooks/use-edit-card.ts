"use client";

import { digitalCardService } from "@/lib/api";

export interface IEditCardLoadState {
  offlineWaiting: boolean;
  loading: boolean;
  loadError: boolean;
  notFound: boolean;
}

const READY: IEditCardLoadState = {
  offlineWaiting: false,
  loading: false,
  loadError: false,
  notFound: false,
};

/** Finds the card being edited in the user's list and reports why it is missing. */
export function useEditCard(isEdit: boolean, id: string | undefined) {
  // Cards have no by-id read in the UI; the user's list covers cold deep links too.
  const cardsQuery = digitalCardService.useGetMyDigitalCards({
    enabled: isEdit,
  });
  const card = isEdit
    ? (cardsQuery.data?.find((item) => item.id === id) ?? null)
    : null;

  if (!isEdit || card) return { card, loadState: READY };

  // isPending, not isLoading: a paused offline fetch is pending but not loading, and
  // would otherwise read as "not found" on a cold deep link.
  const offlineWaiting =
    cardsQuery.isPending && cardsQuery.fetchStatus === "paused";
  const loadError = cardsQuery.isError || offlineWaiting;

  const loadState: IEditCardLoadState = {
    offlineWaiting,
    loading: cardsQuery.isPending && !offlineWaiting,
    loadError,
    notFound: !cardsQuery.isPending && !loadError,
  };

  return { card, loadState };
}
