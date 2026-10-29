// Wi-Fi and cell accuracy is light on the battery and keeps the provider
// warm, so a tap finds a fix already waiting instead of a cold start.
const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 60_000,
};

/**
 * One `watchPosition` the page can pause while hidden without forgetting it
 * was wanted. Its callbacks are fixed at creation, so they must read only
 * refs, state setters and values that never change.
 */
export function createPositionWatch(
  onFix: PositionCallback,
  onError: PositionErrorCallback,
) {
  let id: number | null = null;
  let wanted = false;

  function pause() {
    if (id != null) navigator.geolocation.clearWatch(id);
    id = null;
  }

  function start() {
    wanted = true;
    if (id != null || document.hidden) return;

    id = navigator.geolocation.watchPosition(onFix, onError, WATCH_OPTIONS);
  }

  return {
    start,
    pause,
    /** A watch that already reported an error may never answer again. */
    restart() {
      pause();
      start();
    },
    resume() {
      if (wanted) start();
    },
    stop() {
      wanted = false;
      pause();
    },
  };
}
