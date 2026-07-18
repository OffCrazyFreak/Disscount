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
  // Fields that must never touch localStorage (passwords, base64 images).
  exclude?: Path<T>[];
}

/**
 * Persists a modal form's dirty values to localStorage (24h TTL, handled by the
 * storage layer) so users can close a modal and resume later. Restores once via
 * form.reset with keepDefaultValues, so restored values register as dirty and
 * light up dirty indicators / enable the save button automatically.
 */
export function useFormDraft<T extends FieldValues>({
  draftKey,
  form,
  enabled = true,
  exclude = [],
}: UseFormDraftOptions<T>) {
  // The chip derives from "a draft existed when this modal mounted" so the
  // restore effect never has to set state synchronously.
  const [hadDraft] = useState(() => !!getFormDraft(draftKey));
  const [dismissed, setDismissed] = useState(false);
  const restoredOnceRef = useRef(false);
  const excludeRef = useRef(exclude);

  useEffect(() => {
    excludeRef.current = exclude;
  });

  useEffect(() => {
    if (!enabled || restoredOnceRef.current) return;
    restoredOnceRef.current = true;

    const draft = getFormDraft(draftKey);
    if (!draft) return;

    const values = { ...form.getValues() } as Record<string, unknown>;
    let changed = false;

    for (const [field, value] of Object.entries(draft.values)) {
      if (excludeRef.current.includes(field as Path<T>)) continue;
      if (JSON.stringify(values[field]) === JSON.stringify(value)) continue;
      values[field] = value;
      changed = true;
    }

    if (!changed) return;
    form.reset(values as T, { keepDefaultValues: true });
  }, [enabled, draftKey, form]);

  const flushDraft = useCallback(() => {
    const values = form.getValues() as Record<string, unknown>;
    const payload: Record<string, unknown> = {};

    for (const field of Object.keys(form.formState.dirtyFields)) {
      if (excludeRef.current.includes(field as Path<T>)) continue;
      payload[field] = values[field];
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
      // the user submitted (submit handlers flush themselves, and flushing here
      // would race the async save's removeFormDraft on success).
      if (!form.formState.isSubmitted) flushDraft();
    };
  }, [enabled, draftKey, form, flushDraft]);

  const clearDraft = useCallback(() => {
    removeFormDraft(draftKey);
    setDismissed(true);
  }, [draftKey]);

  return { restored: hadDraft && !dismissed, clearDraft, flushDraft };
}
