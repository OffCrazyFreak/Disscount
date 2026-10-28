"use client";

import { useEffect, useRef, useState } from "react";

import { ILatLon } from "@/app/[locale]/map/utils/distance";

export type GeolocationStatus =
  | "idle"
  | "locating"
  | "located"
  | "approximate"
  | "denied"
  | "unavailable"
  | "timeout";

export interface IGpsPosition extends ILatLon {
  /** Metres, the 95% confidence radius the browser reports. */
  accuracy: number;
}

/** A fix the map should move to; refinements of the same fix do not move it. */
export interface ICenterRequest extends ILatLon {
  id: number;
  /** Started by the page rather than a tap, so it yields to a user who panned. */
  auto: boolean;
  /** Set for a guess that knows the town, not the street. */
  zoom?: number;
}

// The spec does not count time spent on the permission prompt against
// `timeout`, so an ignored prompt would spin forever without our own timer.
const GIVE_UP_MS = 15_000;

// The same town-level zoom the map opens at from an IP guess.
const GUESS_ZOOM = 11;

// A fast Wi-Fi or cell fix comes first; GPS is only worth waiting for when
// that fix is vaguer than a street.
const REFINE_ABOVE_M = 100;

/**
 * Asks for the position on a tap, or by itself when the browser already
 * allows it, and never stores or sends it. The first fix is fast and coarse,
 * then a high-accuracy one sharpens it in place. When a tap gets no position
 * at all, the IP guess stands in, labelled approximate.
 */
export function useGeolocation(fallback: ILatLon | null) {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [position, setPosition] = useState<IGpsPosition | null>(null);
  const [guess, setGuess] = useState<ILatLon | null>(null);
  const [centerRequest, setCenterRequest] = useState<ICenterRequest | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requests = useRef(0);
  // The give-up timer and a late browser error can both fail one tap.
  const guessedFor = useRef(0);

  function settle(next: GeolocationStatus) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setStatus(next);
  }

  // Chrome on Android with the device's location off never answers and ends
  // in a timeout, while desktop Chrome falls back to Wi-Fi and IP by itself.
  function fail(next: GeolocationStatus, id: number) {
    if (!fallback || next === "denied") {
      settle(next);
      return;
    }

    if (guessedFor.current === id) return;
    guessedFor.current = id;

    setGuess(fallback);
    setCenterRequest({ ...fallback, id, auto: false, zoom: GUESS_ZOOM });
    settle("approximate");
  }

  function refine(first: IGpsPosition, id: number) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // A newer request or a clear wins over a late refinement.
        if (requests.current !== id || coords.accuracy >= first.accuracy) {
          return;
        }

        setPosition({
          lat: coords.latitude,
          lon: coords.longitude,
          accuracy: coords.accuracy,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: GIVE_UP_MS, maximumAge: 0 },
    );
  }

  function locate(auto = false) {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    const id = ++requests.current;

    setStatus("locating");

    if (!auto) {
      timer.current = setTimeout(() => fail("timeout", id), GIVE_UP_MS);
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requests.current !== id) return;

        const fix = {
          lat: coords.latitude,
          lon: coords.longitude,
          accuracy: coords.accuracy,
        };

        setPosition(fix);
        setGuess(null);
        setCenterRequest({ lat: fix.lat, lon: fix.lon, id, auto });
        settle("located");

        if (fix.accuracy > REFINE_ABOVE_M) refine(fix, id);
      },
      (error) => {
        if (requests.current !== id) return;

        // An automatic attempt fails quietly; the button is still there.
        if (auto) settle("idle");
        else if (error.code === error.PERMISSION_DENIED) {
          // A refusal after the give-up timer guessed takes the guess back.
          setGuess(null);
          settle("denied");
        } else if (error.code === error.TIMEOUT) fail("timeout", id);
        else fail("unavailable", id);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  // Locating without a tap is fine only when no prompt can appear. Safari may
  // report "prompt" for a granted permission; that just means waiting for a tap.
  useEffect(() => {
    let cancelled = false;

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permission) => {
        if (!cancelled && permission.state === "granted") locate(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clear() {
    requests.current++;
    setPosition(null);
    setGuess(null);
    setCenterRequest(null);
    settle("idle");
  }

  return {
    status,
    position,
    guess,
    centerRequest,
    locate: () => locate(),
    clear,
  };
}
