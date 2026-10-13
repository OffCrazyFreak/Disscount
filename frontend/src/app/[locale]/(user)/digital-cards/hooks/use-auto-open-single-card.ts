"use client";

import { useEffect, useRef } from "react";

import { openModalUrl } from "@/lib/modal/modal-navigation";

const SESSION_KEY = "Disscount_single_card_opened";

interface IUseAutoOpenSingleCardProps {
  /** True once the list has loaded for a signed-in user. */
  ready: boolean;
  /** Id of the only active card, otherwise null. */
  singleCardId: string | null;
}

// Someone with one card is almost always here to scan it, so skip the list once per
// session. Any query param (a search, an open modal) means they came for something else.
// Only the first loaded render counts: saving a first card from this page must not
// bounce the person into it.
export function useAutoOpenSingleCard({
  ready,
  singleCardId,
}: IUseAutoOpenSingleCardProps) {
  const considered = useRef(false);

  useEffect(() => {
    if (!ready || considered.current) return;
    considered.current = true;

    if (!singleCardId || window.location.search) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      return;
    }

    openModalUrl({ name: "digital-card", action: "view", id: singleCardId });
  }, [ready, singleCardId]);
}
