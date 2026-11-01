"use client";

import { useEffect, useRef, useState } from "react";

export type CurrentPositionStatus =
  "idle" | "locating" | "located" | "denied" | "unavailable" | "timeout";

interface IPosition {
  lat: number;
  lon: number;
}

// Counted by the browser only once permission is granted, so a TIMEOUT error
// means the device itself could not find a position.
const FIX_TIMEOUT_MS = 15_000;

// Our own limit also covers time on the permission prompt, which the browser
// does not count, so it is long enough for a slow Allow and ends as
// "unavailable" rather than blaming device settings.
const GIVE_UP_MS = 60_000;

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  // A fix a few minutes old still picks the same nearest store.
  maximumAge: 5 * 60_000,
  timeout: FIX_TIMEOUT_MS,
};

/**
 * One position, asked for only when `request` runs, kept in memory and never
 * stored or sent. A newer request, giving up or unmounting drops any answer
 * still on its way.
 */
export function useCurrentPosition() {
  const [status, setStatus] = useState<CurrentPositionStatus>("idle");
  const [position, setPosition] = useState<IPosition | null>(null);
  const requests = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopTimer() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  useEffect(() => stopTimer, []);

  function request() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    const id = ++requests.current;
    stopTimer();
    setStatus("locating");

    timer.current = setTimeout(() => {
      if (requests.current !== id) return;

      requests.current++;
      timer.current = null;
      setStatus("unavailable");
    }, GIVE_UP_MS);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requests.current !== id) return;
        stopTimer();

        setPosition({ lat: coords.latitude, lon: coords.longitude });
        setStatus("located");
      },
      (error) => {
        if (requests.current !== id) return;
        stopTimer();

        setPosition(null);
        setStatus(
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "unavailable",
        );
      },
      POSITION_OPTIONS,
    );
  }

  return { status, position, request };
}
