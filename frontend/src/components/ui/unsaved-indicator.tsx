"use client";

import { PencilLine } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Amber "unsaved changes" marker shown next to a modal title. "Unsaved changes"
// is the widely-understood wording; a plain dot is too easy to misread.
export function UnsavedIndicator() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label="Nespremljene izmjene"
          className="inline-flex size-5 items-center justify-center rounded-full bg-amber-100 text-amber-600"
        >
          <PencilLine className="size-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-xs">
        Imaš nespremljene izmjene. Klikni Spremi da ih sačuvaš ili Resetiraj da
        ih poništiš.
      </TooltipContent>
    </Tooltip>
  );
}
