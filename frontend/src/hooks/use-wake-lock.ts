import { useEffect, useRef } from "react";

/**
 * Holds the screen awake while enabled, for a barcode being shown to a cashier. Entirely
 * best-effort: unsupported browsers, an insecure context and a low battery all reject the
 * request, and none of that is worth telling the user about.
 *
 * There is no web API for screen brightness, so the code panel forces its own white
 * background instead.
 */
export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    let cancelled = false;

    async function request() {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // Nothing to recover: the screen simply dims as usual.
      }
    }

    function release() {
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    }

    // The browser drops the lock whenever the tab hides, so coming back has to retake it.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !sentinelRef.current) {
        void request();
      }
    }

    void request();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      release();
    };
  }, [enabled]);
}
