"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useFormState,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

import { getCacheIdentity } from "@/lib/offline/cache-identity";
import {
  getFormDraft,
  removeFormDraft,
  setFormDraft,
} from "@/utils/browser/local-storage";

interface IUseFormDraftOptions<T extends FieldValues> {
  draftKey: string;
  form: UseFormReturn<T>;
  // Until defaults load, a draft would diff against empty and read as all-dirty.
  enabled?: boolean;
  // False when the modal merges the draft itself over freshly loaded data.
  restore?: boolean;
  // Fields that must never touch localStorage (passwords, base64 images).
  exclude?: Path<T>[];
  // reset() clears errors and validation runs on edits, so a bad restored value blocks submit silently.
  validateRestored?: Path<T>[];
}

function typeChanged(current: unknown, draftValue: unknown): boolean {
  return (
    current !== undefined &&
    draftValue !== undefined &&
    typeof current !== typeof draftValue
  );
}

/** Copies the draft's usable values onto `values`; false when none differed. */
function applyDraftValues(
  values: Record<string, unknown>,
  draftValues: Record<string, unknown>,
  exclude: string[],
): boolean {
  let changed = false;

  for (const [field, value] of Object.entries(draftValues)) {
    if (exclude.includes(field)) continue;
    // A field the form no longer has; restoring it would keep the dead key alive for the whole TTL.
    if (!(field in values)) continue;
    const current = values[field];
    if (typeChanged(current, value)) continue;
    if (JSON.stringify(current) === JSON.stringify(value)) continue;
    values[field] = value;
    changed = true;
  }

  return changed;
}

/** Changed is computed against default values because RHF's dirtyFields proxy can read empty inside a callback. */
export function useFormDraft<T extends FieldValues>({
  draftKey,
  form,
  enabled = true,
  restore = true,
  exclude = [],
  validateRestored = [],
}: IUseFormDraftOptions<T>) {
  const [hadDraft] = useState(() => !!getFormDraft(draftKey));
  const [dismissed, setDismissed] = useState(false);
  const restoredKeyRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Taken on each open, not at mount: an always-mounted modal outlives sign-ins.
  const ownerIdentityRef = useRef<string | null>(null);

  // A subscription, because the compiler caches form reads and RHF never refreshes an unread flag.
  const { defaultValues, isSubmitted, isSubmitting } = useFormState({
    control: form.control,
  });
  const stateRef = useRef({
    exclude,
    validateRestored,
    defaultValues,
    isSubmitted,
    isSubmitting,
  });

  useEffect(() => {
    stateRef.current = {
      exclude,
      validateRestored,
      defaultValues,
      isSubmitted,
      isSubmitting,
    };
  });

  useEffect(() => {
    // A modal mounted while closed must restore on its next open, since another surface may have written its draft.
    if (!enabled) restoredKeyRef.current = null;
    if (enabled) ownerIdentityRef.current = getCacheIdentity();
    if (!enabled || !restore || restoredKeyRef.current === draftKey) return;
    restoredKeyRef.current = draftKey;

    const draft = getFormDraft(draftKey);
    if (!draft) return;

    const values = { ...form.getValues() } as Record<string, unknown>;
    const changed = applyDraftValues(
      values,
      draft.values,
      stateRef.current.exclude as string[],
    );

    if (!changed) return;
    form.reset(values as T, { keepDefaultValues: true });
    if (stateRef.current.validateRestored.length > 0) {
      void form.trigger(stateRef.current.validateRestored);
    }
  }, [enabled, restore, draftKey, form]);

  const flushDraft = useCallback(() => {
    // Writing now makes a queued save redundant, and a stale one would overwrite what follows.
    clearTimeout(saveTimerRef.current);
    // A switch moves the identity before unmount, so the last flush would save as the next account.
    if (getCacheIdentity() !== ownerIdentityRef.current) return;

    const values = form.getValues() as Record<string, unknown>;
    const { exclude: excluded, defaultValues: defaults } = stateRef.current;
    const payload: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(values)) {
      if (excluded.includes(field as Path<T>)) continue;
      const base = (defaults as Record<string, unknown> | undefined)?.[field];
      if (JSON.stringify(value) === JSON.stringify(base)) continue;
      payload[field] = value;
    }

    if (Object.keys(payload).length === 0) removeFormDraft(draftKey);
    else setFormDraft(draftKey, payload);
  }, [draftKey, form]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch(() => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushDraft, 500);
    });

    return () => {
      clearTimeout(saveTimerRef.current);
      subscription.unsubscribe();
      // A finished submit already cleared the draft, but a failed optimistic submit reopens from it.
      const latest = stateRef.current;
      if (!latest.isSubmitted || latest.isSubmitting) flushDraft();
    };
  }, [enabled, draftKey, form, flushDraft]);

  const clearDraft = useCallback(() => {
    // Otherwise a save queued by an edit just before this would write the draft straight back.
    clearTimeout(saveTimerRef.current);
    removeFormDraft(draftKey);
    setDismissed(true);
  }, [draftKey]);

  return { restored: hadDraft && !dismissed, clearDraft, flushDraft };
}
