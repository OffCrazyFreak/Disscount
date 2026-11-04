"use client";

import { useEffect, useRef } from "react";

import { openModalUrl } from "@/lib/modal/modal-navigation";

const SESSION_KEY = "Disscount_single_card_opened";

interface IUseAutoOpenSingleCardProps {
  ready: boolean;
  singleCardId: string | null;
}

// One card means they came to scan it, so skip the list once per session; only the first loaded render counts, so saving a first card does not bounce them.
export function useAutoOpenSingleCard({
  ready,
  singleCardId,
}: IUseAutoOpenSingleCardProps) {
  const considered = useRef(false);

  useEffect(() => {
    if (!ready || considered.current) return;
    considered.current = true;

    if (!singleCardId || window.location.search || window.location.hash) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      return;
    }

    openModalUrl({ name: "digital-card", action: "view", id: singleCardId });
  }, [ready, singleCardId]);
}
