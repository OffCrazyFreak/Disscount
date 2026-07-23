"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

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
}: IUseFormDraftOptions<T>) {
  const [hadDraft] = useState(() => !!getFormDraft(draftKey));
  const [dismissed, setDismissed] = useState(false);
  const restoredKeyRef = useRef<string | null>(null);

  // Read during render, or RHF's formState proxy stops computing them.
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
      // Drafts written under an older schema would poison validation.
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
      // Flush the debounce on close, but never over an optimistic close's clearDraft.
      if (!form.formState.isSubmitted && !form.formState.isSubmitting) {
        flushDraft();
      }
    };
  }, [enabled, draftKey, form, flushDraft]);

  const clearDraft = useCallback(() => {
    removeFormDraft(draftKey);
    setDismissed(true);
  }, [draftKey]);

  return { restored: hadDraft && !dismissed, clearDraft, flushDraft };
}
