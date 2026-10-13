"use client";

import { useRef, useState } from "react";

import { ILatLon } from "@/app/[locale]/map/utils/distance";

export type GeolocationStatus =
  "idle" | "locating" | "located" | "denied" | "unavailable" | "timeout";

// The spec does not count time spent on the permission prompt against
// `timeout`, so an ignored prompt would spin forever without our own timer.
const GIVE_UP_MS = 15_000;

/**
 * Asks for the position only when called from a tap, at low accuracy (a
 * store search needs a street, not a metre), and never stores or sends it.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [position, setPosition] = useState<ILatLon | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function settle(next: GeolocationStatus) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setStatus(next);
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    setStatus("locating");
    timer.current = setTimeout(() => setStatus("timeout"), GIVE_UP_MS);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lon: coords.longitude });
        settle("located");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) settle("denied");
        else if (error.code === error.TIMEOUT) settle("timeout");
        else settle("unavailable");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  function clear() {
    setPosition(null);
    settle("idle");
  }

  return { status, position, locate, clear };
}
