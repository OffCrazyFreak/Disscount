import {
  ANONYMOUS_IDENTITY,
  getCacheIdentity,
} from "@/lib/offline/cache-identity";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";
import type { IFormDraft } from "@/typings/local-storage";

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

// A counter, as useSyncExternalStore needs a stable snapshot and the blob is rebuilt per write, which would loop.
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

/** Not safe during render, because eviction writes localStorage and notifies subscribers; use peekFormDraft there. */
export function getFormDraft(key: string): IFormDraft | null {
  const draft = peekFormDraft(key);
  if (draft === null && getAppStorage().formDrafts?.[key]) {
    removeFormDraft(key);
  }

  return draft;
}

/** Pure while rendering; another account's draft reads as none, as drafts hold profile fields on shared devices. */
export function peekFormDraft(key: string): IFormDraft | null {
  const draft = getAppStorage().formDrafts?.[key];
  if (!draft || draft.owner !== getCacheIdentity()) return null;

  return Date.now() - draft.savedAt > DRAFT_TTL_MS ? null : draft;
}

/** @param savedAt when carrying a timestamp, as removing one field must not restart the 24h clock. */
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

// For a form saved field by field, because dropping the saved field must not throw away what was typed into the others.
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

/** Must clear the account leaving, not the current one; ownerless drafts predate the owner stamp, so they go too. */
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

/** A first sign-in takes over what was typed signed out; re-tagged so a later switch purges them too. */
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
