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
 * browser) are swallowed: the caller reads `supported` and `failed` and decides whether
 * to hint. `failed` stays false while the first request is still in flight.
 */
export function useWakeLock(enabled: boolean): {
  supported: boolean;
  active: boolean;
  failed: boolean;
} {
  const supported = useSyncExternalStore(
    noopSubscribe,
    detectWakeLock,
    () => false,
  );
  const [state, setState] = useState<"idle" | "held" | "failed">("idle");

  useEffect(() => {
    if (!enabled || !supported) return;

    let cancelled = false;
    let requesting = false;
    let sentinel: WakeLockSentinel | null = null;

    function handleRelease() {
      if (!cancelled) setState("idle");
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
        setState("held");
      } catch {
        if (!cancelled) setState("failed");
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
      // Otherwise re-enabling would report the old lock as held before the new request settles.
      setState("idle");
    };
  }, [enabled, supported]);

  return {
    supported,
    active: enabled && supported && state === "held",
    failed: enabled && supported && state === "failed",
  };
}
