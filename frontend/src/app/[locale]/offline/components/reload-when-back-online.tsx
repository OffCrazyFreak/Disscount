"use client";

import { useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useOnlineStatus } from "@/hooks/runtime/use-online-status";

/** This card stands in for the page that failed to load, so the page is fetched again once queued writes are sent. */
export default function ReloadWhenBackOnline() {
  const isOnline = useOnlineStatus();
  const pendingWrites = useIsMutating();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    // Reloading mid-send would interrupt a queued write, and opening this page online must not loop.
    if (wasOffline.current && pendingWrites === 0) {
      window.location.reload();
    }
  }, [isOnline, pendingWrites]);

  return null;
}
