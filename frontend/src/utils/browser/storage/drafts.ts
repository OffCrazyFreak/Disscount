import {
  ANONYMOUS_IDENTITY,
  getCacheIdentity,
} from "@/lib/offline/cache-identity";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";
import type { IFormDraft } from "@/typings/local-storage";

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

// Anything reading a draft outside a form needs to know when one changes, because a draft
// written in a modal decides what a row behind it renders. A counter rather than the value
// itself: useSyncExternalStore needs a stable snapshot, and the drafts blob is rebuilt on
// every write, so returning it directly would loop.
const listeners = new Set<() => void>();
let version = 0;

export function subscribeToFormDrafts(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getFormDraftsVersion() {
  return version;
}

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/**
 * Reads and evicts. Only call it where a write is acceptable: it is not safe during
 * render, because the eviction writes localStorage and notifies subscribers, which
 * schedules updates on other components mid-render. Use peekFormDraft there.
 */
export function getFormDraft(key: string): IFormDraft | null {
  const draft = peekFormDraft(key);
  if (draft === null && getAppStorage().formDrafts?.[key]) {
    removeFormDraft(key);
  }

  return draft;
}

/**
 * The same read with no eviction, so it is pure and safe to call while rendering.
 * Another account's draft reads as none: drafts hold profile fields like the username,
 * and the device is shared with whoever signs in next.
 */
export function peekFormDraft(key: string): IFormDraft | null {
  const draft = getAppStorage().formDrafts?.[key];
  if (!draft || draft.owner !== getCacheIdentity()) return null;

  return Date.now() - draft.savedAt > DRAFT_TTL_MS ? null : draft;
}

/**
 * @param savedAt when carrying an existing draft's timestamp forward. Removing one field
 *   must not restart the 24h clock on the fields left behind, which a fresh stamp would.
 */
export function setFormDraft(
  key: string,
  values: Record<string, unknown>,
  savedAt: number = Date.now(),
) {
  const drafts = { ...getAppStorage().formDrafts };
  drafts[key] = { savedAt, owner: getCacheIdentity(), values };
  setAppStorage({ formDrafts: drafts });
  notify();
}

// For a form whose fields are saved one at a time: dropping the saved field must
// not throw away what the user typed into the others.
export function removeFormDraftField(key: string, field: string) {
  const draft = getFormDraft(key);
  if (!draft || !(field in draft.values)) return;

  const { [field]: _saved, ...rest } = draft.values;

  if (Object.keys(rest).length === 0) removeFormDraft(key);
  else setFormDraft(key, rest, draft.savedAt);
}

export function removeFormDraft(key: string) {
  const drafts = { ...getAppStorage().formDrafts };
  if (!(key in drafts)) return;

  delete drafts[key];
  setAppStorage({ formDrafts: drafts });
  notify();
}

/**
 * For the account purge, which must clear the account leaving, not the one now current.
 * Ownerless drafts predate the owner stamp and can belong to anyone, so they go too.
 */
export function removeFormDraftsFor(identity: string) {
  const drafts = getAppStorage().formDrafts ?? {};
  const kept = Object.fromEntries(
    Object.entries(drafts).filter(
      ([, draft]) => draft.owner && draft.owner !== identity,
    ),
  );
  if (Object.keys(kept).length === Object.keys(drafts).length) return;

  setAppStorage({ formDrafts: kept });
  notify();
}

/**
 * A first sign-in takes over what was typed signed out, the guest mode's "imports on
 * login". Re-tagged rather than shared, so a later switch purges them with this account.
 */
export function adoptGuestFormDrafts(identity: string) {
  const drafts = getAppStorage().formDrafts ?? {};
  if (!Object.values(drafts).some(({ owner }) => owner === ANONYMOUS_IDENTITY))
    return;

  const adopted = Object.fromEntries(
    Object.entries(drafts).map(([key, draft]) => [
      key,
      draft.owner === ANONYMOUS_IDENTITY
        ? { ...draft, owner: identity }
        : draft,
    ]),
  );
  setAppStorage({ formDrafts: adopted });
  notify();
}
