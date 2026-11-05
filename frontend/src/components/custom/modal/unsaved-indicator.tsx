"use client";

import { PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Spelled out, since a plain dot is too easy to misread.
export function UnsavedIndicator() {
  const t = useTranslations("shell");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={t("modal.unsavedLabel")}
          className="inline-flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-600"
        >
          <PencilLine className="size-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent variant="warningSoft" className="max-w-56 text-xs">
        {t("modal.unsavedHint")}
      </TooltipContent>
    </Tooltip>
  );
}
