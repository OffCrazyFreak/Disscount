const LAST_RELOAD_KEY = "disscount:chunk-reload-at";

// Long enough that a chunk still failing on the fresh page shows the error; short enough that a later deploy recovers too.
const RELOAD_COOLDOWN_MS = 60_000;

// webpack names a failed script chunk ChunkLoadError; a failed CSS chunk only carries the message.
const CHUNK_LOAD_MESSAGE = /Loading (CSS )?chunk [\w-]+ failed/;

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === "ChunkLoadError" || CHUNK_LOAD_MESSAGE.test(error.message)
  );
}

function readLastReload(storage: Storage): number | null {
  const value = Number(storage.getItem(LAST_RELOAD_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** A tab from before a deploy asks for chunks the new build lacks; returns whether it reloaded so the caller reports what it did not recover. */
export function reloadAfterChunkLoadError(
  error: unknown,
  reload: () => void = () => window.location.reload(),
  now: number = Date.now(),
): boolean {
  if (!isChunkLoadError(error)) return false;

  // Offline, a reload would only swap the page for the offline fallback; the boundary's retry button is the better offer.
  if (navigator.onLine === false) return false;

  try {
    const lastReload = readLastReload(sessionStorage);
    if (lastReload !== null && now - lastReload < RELOAD_COOLDOWN_MS) {
      return false;
    }

    sessionStorage.setItem(LAST_RELOAD_KEY, String(now));
  } catch {
    // Without storage there is no loop guard, so a reload could repeat forever.
    return false;
  }

  reload();
  return true;
}
