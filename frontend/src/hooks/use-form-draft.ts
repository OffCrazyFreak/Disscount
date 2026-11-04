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
  // reset() clears errors and mode "onChange" validates only on edits, so a restored value that
  // breaks a rule would otherwise block submit with no message.
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
    // A field the form no longer has, from a draft written before the shape
    // changed. Restoring it would keep the dead key alive for the whole TTL.
    if (!(field in values)) continue;
    const current = values[field];
    if (typeChanged(current, value)) continue;
    if (JSON.stringify(current) === JSON.stringify(value)) continue;
    values[field] = value;
    changed = true;
  }

  return changed;
}

/**
 * Persists a modal form's changed values to localStorage (24h TTL) so users can
 * close a modal and resume later. "Changed" is computed by comparing current
 * values against the form's default values (not RHF's dirtyFields, whose proxy
 * can read empty inside a callback), which makes persistence reliable.
 */
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
  // Taken on each open, not at mount: an always-mounted modal outlives sign-ins.
  const ownerIdentityRef = useRef<string | null>(null);

  // A subscription, not form.formState: the React Compiler caches reads off the stable
  // form object, and RHF never refreshes a flag that no render has read.
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
    // A modal that stays mounted while closed must restore again on its next open,
    // since another surface may have written its draft in between.
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
    // An account switch moves the identity before this form unmounts, and its last flush
    // would otherwise save the departing account's values as the next account's draft.
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

    let timer: ReturnType<typeof setTimeout>;
    const subscription = form.watch(() => {
      clearTimeout(timer);
      timer = setTimeout(flushDraft, 500);
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
      // A finished submit already cleared the draft, but a failed optimistic submit reopens from it.
      const latest = stateRef.current;
      if (!latest.isSubmitted || latest.isSubmitting) flushDraft();
    };
  }, [enabled, draftKey, form, flushDraft]);

  const clearDraft = useCallback(() => {
    removeFormDraft(draftKey);
    setDismissed(true);
  }, [draftKey]);

  return { restored: hadDraft && !dismissed, clearDraft, flushDraft };
}
