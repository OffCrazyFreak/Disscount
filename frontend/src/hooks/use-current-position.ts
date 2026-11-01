"use client";

import { useRef, useState } from "react";

export type CurrentPositionStatus =
  "idle" | "locating" | "located" | "denied" | "unavailable" | "timeout";

interface IPosition {
  lat: number;
  lon: number;
}

// The spec does not count time spent on the permission prompt against
// `timeout`, so an ignored prompt would spin forever without our own timer.
const GIVE_UP_MS = 15_000;

// A fix a few minutes old still picks the same nearest store.
const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 5 * 60_000,
  timeout: GIVE_UP_MS,
};

/**
 * One position, asked for only when `request` runs, kept in memory and never
 * stored or sent. A newer request makes any earlier answer stale.
 */
export function useCurrentPosition() {
  const [status, setStatus] = useState<CurrentPositionStatus>("idle");
  const [position, setPosition] = useState<IPosition | null>(null);
  const requests = useRef(0);

  function request() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    const id = ++requests.current;
    setStatus("locating");

    const timer = setTimeout(() => {
      if (requests.current === id) setStatus("timeout");
    }, GIVE_UP_MS);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        clearTimeout(timer);
        if (requests.current !== id) return;

        setPosition({ lat: coords.latitude, lon: coords.longitude });
        setStatus("located");
      },
      (error) => {
        clearTimeout(timer);
        if (requests.current !== id) return;

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
