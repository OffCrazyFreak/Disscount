"use client";

import {
  useIsMutating,
  useIsRestoring,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useOnlineStatus } from "@/hooks/runtime/use-online-status";
import { saveCacheNow } from "@/lib/offline/cache/persister";

/** This card stands in for the page that failed to load, so the page is fetched again once queued writes are sent. */
export default function ReloadWhenBackOnline() {
  const isOnline = useOnlineStatus();
  const pendingWrites = useIsMutating();
  const isRestoring = useIsRestoring();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    // Mid-send or mid-restore a save would cut or erase the queue, and opening this page online must not loop.
    if (wasOffline.current && !isRestoring && pendingWrites === 0) {
      wasOffline.current = false;
      // A skipped save (purged meanwhile) still reloads, since nothing of this account is left to resend.
      void saveCacheNow(queryClient)
        .catch(() => undefined)
        .finally(() => window.location.reload());
    }
  }, [isOnline, isRestoring, pendingWrites, queryClient]);

  return null;
}
