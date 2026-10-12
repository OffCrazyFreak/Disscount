"use client";

import { useEffect } from "react";

import { openModalUrl } from "@/lib/modal/modal-navigation";

const SESSION_KEY = "Disscount_single_card_opened";

interface IUseAutoOpenSingleCardProps {
  /** Id of the only active card once the list has loaded, otherwise null. */
  singleCardId: string | null;
}

// Someone with one card is almost always here to scan it, so skip the list once per
// session. Any query param (a search, an open modal) means they came for something else.
export function useAutoOpenSingleCard({
  singleCardId,
}: IUseAutoOpenSingleCardProps) {
  useEffect(() => {
    if (!singleCardId || window.location.search) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      return;
    }

    openModalUrl({ name: "digital-card", action: "view", id: singleCardId });
  }, [singleCardId]);
}
