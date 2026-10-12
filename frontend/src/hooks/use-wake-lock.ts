"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function noopSubscribe() {
  return () => {};
}

function detectWakeLock() {
  return "wakeLock" in navigator;
}

/**
 * Keeps the screen awake while `enabled`. Browsers drop the lock whenever the tab is
 * hidden, so it is requested again on return. Refusals (low battery, unsupported
 * browser) are swallowed: the caller reads `active` and decides whether to hint.
 */
export function useWakeLock(enabled: boolean): {
  supported: boolean;
  active: boolean;
} {
  const supported = useSyncExternalStore(
    noopSubscribe,
    detectWakeLock,
    () => false,
  );
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!enabled || !supported) return;

    let cancelled = false;
    let requesting = false;
    let sentinel: WakeLockSentinel | null = null;

    function handleRelease() {
      if (!cancelled) setHeld(false);
    }

    async function acquire() {
      if (requesting || document.visibilityState !== "visible") return;
      if (sentinel && !sentinel.released) return;

      requesting = true;

      try {
        const next = await navigator.wakeLock.request("screen");

        // The effect may have been torn down while the request was in flight.
        if (cancelled) {
          void next.release().catch(() => {});
          return;
        }

        sentinel = next;
        next.addEventListener("release", handleRelease);
        setHeld(true);
      } catch {
        if (!cancelled) setHeld(false);
      } finally {
        requesting = false;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") void acquire();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    void acquire();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      sentinel?.removeEventListener("release", handleRelease);
      void sentinel?.release().catch(() => {});
    };
  }, [enabled, supported]);

  return { supported, active: enabled && supported && held };
}
