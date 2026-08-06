"use client";

import { useId } from "react";
import { Globe, Lock } from "lucide-react";

import LabeledSelect from "@/components/custom/common/labeled-select";
import type { LinkAccess } from "@/lib/api/types";
import {
  LINK_ACCESS_HINTS,
  LINK_ACCESS_LABELS,
  LINK_ACCESS_LEVELS,
  LINK_ACCESS_ROW_TITLES,
} from "@/app/(user)/shopping-lists/utils/link-access-copy";
import { cn } from "@/lib/utils";

const LEVEL_OPTIONS = LINK_ACCESS_LEVELS.map((value) => ({
  value,
  label: LINK_ACCESS_LABELS[value],
}));

interface IShareAccessRowProps {
  linkAccess: LinkAccess;
  onLevelChange: (level: LinkAccess) => void;
  isSaving: boolean;
  /** Lets the modal point its disabled share button at the same explanation. */
  hintId?: string;
}

/**
 * Who can reach the list, as one row: an icon and a headline that state the situation, and
 * a single select that changes it. Private is the first option rather than a separate
 * switch, so there is one control and one thing to read.
 */
export default function ShareAccessRow({
  linkAccess,
  onLevelChange,
  isSaving,
  hintId,
}: IShareAccessRowProps) {
  const fallbackHintId = useId();
  const describedById = hintId ?? fallbackHintId;

  const isShared = linkAccess !== "NONE";
  const Icon = isShared ? Globe : Lock;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full",
            isShared
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {/* size-6 matches the bottom nav glyph and the list card's own visibility
              indicator, so the same lock and globe read at one size across the app. */}
          <Icon className="size-6" aria-hidden="true" />
        </span>

        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">
            {LINK_ACCESS_ROW_TITLES[linkAccess]}
          </p>
          <p id={describedById} className="text-xs text-muted-foreground">
            {LINK_ACCESS_HINTS[linkAccess]}
          </p>
        </div>
      </div>

      <LabeledSelect<LinkAccess>
        label="Tko ima pristup popisu"
        srOnlyLabel
        value={linkAccess}
        onValueChange={onLevelChange}
        options={LEVEL_OPTIONS}
        disabled={isSaving}
        describedById={describedById}
        className="sm:shrink-0"
        triggerClassName="sm:w-44"
      />
    </div>
  );
}
