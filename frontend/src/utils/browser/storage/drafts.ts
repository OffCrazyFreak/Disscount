import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";
import type { IFormDraft } from "@/typings/local-storage";

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

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
}

export function removeFormDraft(key: string) {
  const drafts = { ...getAppStorage().formDrafts };
  if (!(key in drafts)) return;

  delete drafts[key];
  setAppStorage({ formDrafts: drafts });
}
