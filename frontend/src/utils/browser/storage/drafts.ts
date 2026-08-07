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

export function getFormDraft(key: string): IFormDraft | null {
  const draft = getAppStorage().formDrafts?.[key];
  if (!draft) return null;

  if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
    removeFormDraft(key);
    return null;
  }

  return draft;
}

export function setFormDraft(key: string, values: Record<string, unknown>) {
  const drafts = { ...getAppStorage().formDrafts };
  drafts[key] = { savedAt: Date.now(), values };
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
  else setFormDraft(key, rest);
}

export function removeFormDraft(key: string) {
  const drafts = { ...getAppStorage().formDrafts };
  if (!(key in drafts)) return;

  delete drafts[key];
  setAppStorage({ formDrafts: drafts });
  notify();
}
