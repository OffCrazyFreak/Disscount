"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import {
  getFormDraft,
  removeFormDraft,
  setFormDraft,
} from "@/utils/browser/local-storage";

interface UseFormDraftOptions<T extends FieldValues> {
  draftKey: string;
  form: UseFormReturn<T>;
  // Gate restoring until server defaults are loaded into the form, otherwise
  // the draft would diff against empty defaults and mark everything dirty.
  enabled?: boolean;
  // Set false when the modal applies the draft itself (edit modals merge it over
  // freshly loaded data). The hook then only persists and exposes getDraft/clear.
  restore?: boolean;
  // Fields that must never touch localStorage (passwords, base64 images).
  exclude?: Path<T>[];
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
}: UseFormDraftOptions<T>) {
  const [hadDraft] = useState(() => !!getFormDraft(draftKey));
  const [dismissed, setDismissed] = useState(false);
  const restoredKeyRef = useRef<string | null>(null);

  // Read defaults during render so RHF's formState proxy keeps them computed,
  // then mirror into a ref the (stable) flush callback can read.
  const defaultValues = form.formState.defaultValues;
  const stateRef = useRef({ exclude, defaultValues });

  useEffect(() => {
    stateRef.current = { exclude, defaultValues };
  });

  useEffect(() => {
    if (!enabled || !restore || restoredKeyRef.current === draftKey) return;
    restoredKeyRef.current = draftKey;

    const draft = getFormDraft(draftKey);
    if (!draft) return;

    const values = { ...form.getValues() } as Record<string, unknown>;
    let changed = false;

    for (const [field, value] of Object.entries(draft.values)) {
      if (stateRef.current.exclude.includes(field as Path<T>)) continue;
      const current = values[field];
      // Ignore drafts written under an older schema (e.g. a number where the
      // field is now a string) so they can't poison validation.
      if (
        current !== undefined &&
        value !== undefined &&
        typeof current !== typeof value
      ) {
        continue;
      }
      if (JSON.stringify(current) === JSON.stringify(value)) continue;
      values[field] = value;
      changed = true;
    }

    if (!changed) return;
    form.reset(values as T, { keepDefaultValues: true });
  }, [enabled, restore, draftKey, form]);

  const flushDraft = useCallback(() => {
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
      // Closing mid-debounce would lose the last keystrokes; flush them unless
      // the user submitted (submit handlers clear the draft on success).
      if (!form.formState.isSubmitted) flushDraft();
    };
  }, [enabled, draftKey, form, flushDraft]);

  const clearDraft = useCallback(() => {
    removeFormDraft(draftKey);
    setDismissed(true);
  }, [draftKey]);

  return { restored: hadDraft && !dismissed, clearDraft, flushDraft };
}
