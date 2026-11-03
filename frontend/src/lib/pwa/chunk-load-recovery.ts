const LAST_RELOAD_KEY = "disscount:chunk-reload-at";

// Long enough that a chunk which still fails on the fresh page shows the error
// instead of reloading again; short enough that a later deploy recovers too.
const RELOAD_COOLDOWN_MS = 60_000;

// webpack names a failed script chunk ChunkLoadError; a failed CSS chunk only
// carries the message.
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

/**
 * A tab opened before a deploy asks for chunks the new build no longer has, and
 * a full page load fetches the current ones. Returns whether it reloaded, so
 * the caller can report the errors it did not recover from.
 */
export function reloadAfterChunkLoadError(
  error: unknown,
  reload: () => void = () => window.location.reload(),
  now: number = Date.now(),
): boolean {
  if (!isChunkLoadError(error)) return false;

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
