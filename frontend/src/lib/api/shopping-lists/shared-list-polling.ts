import type { QueryState } from "@tanstack/react-query";
import { isDeadListLink } from "@/lib/api/shopping-lists/is-dead-list-link";
import type { ShoppingListDto } from "@/lib/api/types";

const ACTIVE_POLL_MS = 5_000;
const IDLE_POLL_MS = 30_000;
// Fast only while recently changed, which keeps idle viewers cheap.
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

// Keyed by the query object so observers of one list share a clock and an evicted query takes its entry with it.
const lastChanges = new WeakMap<
  object,
  { updatedAt: string; changedAt: number }
>();

/** The first version seen counts as a change, since opening a shared list usually means someone is about to shop it. */
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

  // Likely dropped shop wifi, and a phone left here may never fire the focus refetch to restart polling.
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
