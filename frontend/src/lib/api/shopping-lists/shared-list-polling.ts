import type { QueryState } from "@tanstack/react-query";
import type { ShoppingListDto } from "@/lib/api/types";

const ACTIVE_POLL_MS = 5_000;
const IDLE_POLL_MS = 30_000;
// A list someone is shopping changes every few seconds, one left open on a counter does
// not, so polling fast only while it recently changed keeps idle viewers cheap.
const ACTIVE_WINDOW_MS = 2 * 60_000;

/** Someone else can change it: a list the owner shares by link, or anyone's reached by one. */
export function isSharedList(
  list: Pick<ShoppingListDto, "myAccess" | "linkAccess">,
) {
  return (
    list.myAccess !== "OWNER" ||
    (list.linkAccess != null && list.linkAccess !== "NONE")
  );
}

// Keyed by the query object so every observer of one list shares the same clock and an
// evicted query takes its entry with it.
const lastChanges = new WeakMap<
  object,
  { updatedAt: string; changedAt: number }
>();

/**
 * The refetchInterval for a list, recomputed by TanStack Query on every update to it.
 * The first sighting counts as a change, since opening a shared list usually means
 * someone is about to shop it.
 */
export function sharedListRefetchInterval(
  query: { state: QueryState<ShoppingListDto, Error> },
  isWritingLists: boolean,
): number | false {
  const list = query.state.data;

  // An error is usually a 404: the list was deleted or stopped being shared.
  if (query.state.status === "error" || !list || !isSharedList(list)) {
    return false;
  }

  // A poll landing mid-write would replace the optimistic cache with the pre-write list.
  if (isWritingLists) return false;

  const now = Date.now();
  const lastChange = lastChanges.get(query);

  if (lastChange?.updatedAt !== list.updatedAt) {
    lastChanges.set(query, { updatedAt: list.updatedAt, changedAt: now });
    return ACTIVE_POLL_MS;
  }

  return now - lastChange.changedAt < ACTIVE_WINDOW_MS
    ? ACTIVE_POLL_MS
    : IDLE_POLL_MS;
}
