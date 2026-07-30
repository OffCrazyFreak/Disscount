const STORAGE_KEY = "disscount-skeleton-rows";

// Enough rows to look like the real list, few enough that a long list does not
// paint a wall of grey.
const MIN_ROWS = 1;
const MAX_ROWS = 8;

type RowCounts = Record<string, number>;

const listeners = new Set<() => void>();

// Reading localStorage on every useSyncExternalStore getSnapshot would be both
// slow and unstable (a fresh object each call loops React), so the parsed map is
// cached and only rebuilt on write.
let cache: RowCounts | null = null;

function read(): RowCounts {
  if (cache) return cache;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as RowCounts) : {};
  } catch {
    // Private mode, quota, or a hand-edited value. A wrong row count is not
    // worth throwing over.
    cache = {};
  }

  return cache;
}

export function clampRowCount(count: number): number {
  return Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.round(count)));
}

export function getRowCount(key: string): number | undefined {
  if (typeof window === "undefined") return undefined;

  const stored = read()[key];

  return typeof stored === "number" ? clampRowCount(stored) : undefined;
}

export function setRowCount(key: string, count: number): void {
  if (typeof window === "undefined") return;

  const clamped = clampRowCount(count);
  if (read()[key] === clamped) return;

  cache = { ...read(), [key]: clamped };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Keep the in-memory value; it still helps for the rest of the session.
  }

  for (const listener of listeners) listener();
}

export function subscribeToRowCounts(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
