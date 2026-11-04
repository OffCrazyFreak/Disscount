"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import type { LinkAccess } from "@/lib/api/types";
import {
  LINK_ACCESS_HINT_KEYS,
  LINK_ACCESS_LABEL_KEYS,
  LINK_ACCESS_LEVELS,
  LINK_ACCESS_ROW_TITLE_KEYS,
} from "@/app/[locale]/(user)/shopping-lists/utils/link-access-copy";
import { LINK_ACCESS_ICONS } from "@/app/[locale]/(user)/shopping-lists/utils/link-access-icons";
import { cn } from "@/lib/utils";

interface IShareAccessRowProps {
  linkAccess: LinkAccess;
  onLevelChange: (level: LinkAccess) => void;
  isSaving: boolean;
  /** Lets the modal point its disabled share button at the same explanation. */
  hintId?: string;
}

/** Private is the first option rather than a separate switch, so there is one control and one thing to read. */
export default function ShareAccessRow({
  linkAccess,
  onLevelChange,
  isSaving,
  hintId,
}: IShareAccessRowProps) {
  const t = useTranslations("shoppingLists");
  const fallbackHintId = useId();
  const labelId = useId();
  const describedById = hintId ?? fallbackHintId;

  const isShared = linkAccess !== "NONE";
  const Icon = LINK_ACCESS_ICONS[linkAccess];

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
          {/* size-6 matches the bottom nav glyph and the list card's visibility indicator, so the same icons read at one size. */}
          <Icon className="size-6" aria-hidden="true" />
        </span>

        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">
            {t(LINK_ACCESS_ROW_TITLE_KEYS[linkAccess])}
          </p>
          <p id={describedById} className="text-xs text-muted-foreground">
            {t(LINK_ACCESS_HINT_KEYS[linkAccess])}
          </p>
        </div>
      </div>

      <span id={labelId} className="sr-only">
        {t("shareModal.accessLabel")}
      </span>

      <Select
        value={linkAccess}
        disabled={isSaving}
        onValueChange={(next) => onLevelChange(next as LinkAccess)}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          aria-describedby={describedById}
          className="w-full bg-background sm:w-48 sm:shrink-0"
        >
          {/* Grouped because the trigger is justify-between; size-5 is 1rem here because --spacing is 0.2rem, so the spinner swap moves the label by nothing. */}
          <span className="flex min-w-0 items-center gap-2">
            {isSaving ? (
              <BlockLoadingSpinner size={16} className="px-0 text-primary" />
            ) : (
              <Icon
                className="size-5 shrink-0 text-current"
                aria-hidden="true"
              />
            )}
            <SelectValue />
          </span>
        </SelectTrigger>

        <SelectContent>
          {LINK_ACCESS_LEVELS.map((level) => (
            <SelectItem
              key={level}
              value={level}
              icon={LINK_ACCESS_ICONS[level]}
            >
              {t(LINK_ACCESS_LABEL_KEYS[level])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
