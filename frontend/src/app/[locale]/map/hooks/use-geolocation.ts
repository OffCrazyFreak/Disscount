"use client";

import { useEffect, useRef, useState } from "react";

import { ILatLon } from "@/app/[locale]/map/utils/distance";
import { isNewFix } from "@/app/[locale]/map/utils/position-fix";

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
  /** Metres around a guess that knows the town, not the street; the map fits it. */
  radius?: number;
}

// The spec does not count time spent on the permission prompt against
// `timeout`, so an ignored prompt would spin forever without our own timer.
const GIVE_UP_MS = 15_000;

// Chrome on Android with the device's location off never answers at all, so a
// tap that already has permission shows the IP guess this soon and keeps
// listening for a real fix.
const GUESS_AFTER_MS = 1_500;

// Home connections usually land within this; mobile data can land a city off.
export const GUESS_RADIUS_M = 10_000;

// A fast Wi-Fi or cell fix comes first; GPS is only worth waiting for when
// that fix is vaguer than a street.
const REFINE_ABOVE_M = 100;

// Wi-Fi and cell accuracy is light on the battery and keeps the provider
// warm, so a tap finds a fix already waiting instead of a cold start.
const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 60_000,
};

/**
 * Watches the position while the map is visible, from the start when the
 * browser already allows it and otherwise from the first tap, and never
 * stores or sends it. A tap moves to the latest fix at once and sharpens it
 * with one GPS reading. When a tap gets no position, the IP guess stands in,
 * labelled approximate.
 */
export function useGeolocation(fallback: ILatLon | null) {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [position, setPosition] = useState<IGpsPosition | null>(null);
  const [guess, setGuess] = useState<ILatLon | null>(null);
  const [centerRequest, setCenterRequest] = useState<ICenterRequest | null>(
    null,
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const requests = useRef(0);
  const watchId = useRef<number | null>(null);
  // Whether the page wants a watch; a hidden tab pauses it without forgetting.
  const watching = useRef(false);
  const latest = useRef<IGpsPosition | null>(null);
  // The tap still waiting for its first fix, 0 when none is.
  const pendingTap = useRef(0);
  // The first fix of a watch the page started by itself centres the map.
  const autoCenter = useRef(false);
  const granted = useRef(false);
  // The early guess and the give-up timer can both answer one tap.
  const guessedFor = useRef(0);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function settle(next: GeolocationStatus) {
    clearTimers();
    setStatus(next);
  }

  function showGuess(id: number) {
    if (!fallback || guessedFor.current === id) return;
    guessedFor.current = id;

    // This tap's answer replaces an earlier fix, so the list and the note agree.
    setPosition(null);
    setGuess(fallback);
    setCenterRequest({ ...fallback, id, auto: false, radius: GUESS_RADIUS_M });
    setStatus("approximate");
  }

  function fail(next: GeolocationStatus, id: number) {
    if (pendingTap.current !== id) return;
    pendingTap.current = 0;

    if (!fallback) {
      settle(next);
      return;
    }

    showGuess(id);
    settle("approximate");
  }

  function refine(first: IGpsPosition, id: number) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // A newer request or a clear wins over a late refinement.
        if (requests.current !== id || coords.accuracy >= first.accuracy) {
          return;
        }

        const fix = {
          lat: coords.latitude,
          lon: coords.longitude,
          accuracy: coords.accuracy,
        };
        latest.current = fix;
        setPosition(fix);
      },
      () => {},
      { enableHighAccuracy: true, timeout: GIVE_UP_MS, maximumAge: 0 },
    );
  }

  function onFix({ coords }: GeolocationPosition) {
    const fix = {
      lat: coords.latitude,
      lon: coords.longitude,
      accuracy: coords.accuracy,
    };
    const tap = pendingTap.current;
    const centre = tap !== 0 || autoCenter.current;

    if (!centre && !isNewFix(latest.current, fix)) return;

    latest.current = fix;
    setPosition(fix);
    setGuess(null);
    settle("located");

    if (!centre) return;

    pendingTap.current = 0;
    autoCenter.current = false;
    const id = tap || ++requests.current;
    setCenterRequest({ lat: fix.lat, lon: fix.lon, id, auto: tap === 0 });

    if (tap && fix.accuracy > REFINE_ABOVE_M) refine(fix, tap);
  }

  function onError(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      // A refusal after the give-up timer guessed takes the guess back.
      stopWatch();
      latest.current = null;
      pendingTap.current = 0;
      autoCenter.current = false;
      setPosition(null);
      setGuess(null);
      setCenterRequest(null);
      settle("denied");
      return;
    }

    // An automatic watch fails quietly; the button is still there.
    const tap = pendingTap.current;
    if (tap)
      fail(error.code === error.TIMEOUT ? "timeout" : "unavailable", tap);
  }

  function startWatch() {
    watching.current = true;
    if (watchId.current != null || document.hidden) return;

    watchId.current = navigator.geolocation.watchPosition(
      onFix,
      onError,
      WATCH_OPTIONS,
    );
  }

  function pauseWatch() {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
  }

  function stopWatch() {
    watching.current = false;
    pauseWatch();
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    const id = ++requests.current;
    const known = latest.current;

    if (known) {
      setGuess(null);
      setCenterRequest({ lat: known.lat, lon: known.lon, id, auto: false });
      settle("located");
      startWatch();
      if (known.accuracy > REFINE_ABOVE_M) refine(known, id);
      return;
    }

    pendingTap.current = id;
    settle("locating");

    // Without permission the prompt may be open, and a guess under it would
    // flash before the answer.
    if (granted.current && fallback) {
      timers.current.push(
        setTimeout(() => {
          if (pendingTap.current === id) showGuess(id);
        }, GUESS_AFTER_MS),
      );
    }
    timers.current.push(setTimeout(() => fail("timeout", id), GIVE_UP_MS));

    startWatch();
  }

  // Watching without a tap is fine only when no prompt can appear. Safari may
  // report "prompt" for a granted permission; that just means waiting for a tap.
  useEffect(() => {
    let cancelled = false;

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permission) => {
        if (cancelled) return;

        granted.current = permission.state === "granted";
        permission.onchange = () => {
          granted.current = permission.state === "granted";
        };

        if (granted.current && "geolocation" in navigator) {
          autoCenter.current = true;
          startWatch();
        }
      })
      .catch(() => {});

    // The browser sends a hidden tab nothing anyway; stopping spares the battery.
    function handleVisibility() {
      if (document.hidden) pauseWatch();
      else if (watching.current) startWatch();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      stopWatch();
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clear() {
    requests.current++;
    pendingTap.current = 0;
    autoCenter.current = false;
    latest.current = null;
    stopWatch();
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
    locate,
    clear,
  };
}
