"use client";

import CopyButton from "@/components/custom/common/copy-button";
import LabeledSelect from "@/components/custom/common/labeled-select";
import {
  LINK_ACCESS_HINTS,
  LINK_ACCESS_LABELS,
  SHAREABLE_LEVELS,
  type LinkAccess,
} from "@/lib/api/schemas/shopping-list";

const LEVEL_OPTIONS = SHAREABLE_LEVELS.map((value) => ({
  value,
  label: LINK_ACCESS_LABELS[value],
}));

interface IShareLinkRowProps {
  linkAccess: LinkAccess;
  onLevelChange: (level: LinkAccess) => void;
  shareUrl: string | null;
  isSaving: boolean;
}

/** The level picker and the link itself, shown once sharing is on. */
export default function ShareLinkRow({
  linkAccess,
  onLevelChange,
  shareUrl,
  isSaving,
}: IShareLinkRowProps) {
  const hintId = "share-level-hint";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <LabeledSelect<LinkAccess>
          // Third person throughout: this panel is owner-only, and the hints describe what
          // the people holding the link can do, not what the owner can.
          label="Što drugi mogu raditi"
          value={linkAccess}
          onValueChange={onLevelChange}
          options={LEVEL_OPTIONS}
          disabled={isSaving}
          describedById={hintId}
          className="justify-between"
        />
        <p id={hintId} className="text-xs text-muted-foreground">
          {LINK_ACCESS_HINTS[linkAccess]}
        </p>
      </div>

      {shareUrl && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
          <p className="min-w-0 flex-1 truncate font-mono text-xs">
            {shareUrl}
          </p>
          <CopyButton
            value={shareUrl}
            label="Kopiraj poveznicu"
            successMessage="Poveznica je kopirana"
          />
        </div>
      )}
    </div>
  );
}
