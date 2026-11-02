import type { QueryState } from "@tanstack/react-query";
import { isDeadListLink } from "@/lib/api/shopping-lists/is-dead-list-link";
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
 * The refetchInterval for a list, recomputed by TanStack Query on every render and update.
 * The first version this cache entry sees counts as a change, since opening a shared list
 * usually means someone is about to shop it; a reopened list keeps the clock it had.
 */
export function sharedListRefetchInterval(
  query: { state: QueryState<ShoppingListDto, Error> },
  isWritingLists: boolean,
): number | false {
  const list = query.state.data;

  if (!list || !isSharedList(list) || isDeadListLink(query.state.error)) {
    return false;
  }

  // A poll landing mid-write would replace the optimistic cache with the pre-write list.
  if (isWritingLists) return false;

  // Anything but a 404 is likely a dropped request on shop wifi, and a phone left on the
  // list may never fire the focus refetch that would otherwise restart polling.
  if (query.state.status === "error") return IDLE_POLL_MS;

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
