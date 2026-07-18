"use client";

import { History } from "lucide-react";

// Shown in a modal footer when useFormDraft restored unsaved values, so the
// user knows why fields are pre-filled and dirty.
export function DraftRestoredChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
      <History size={12} />
      Vraćene nedovršene izmjene
    </span>
  );
}
