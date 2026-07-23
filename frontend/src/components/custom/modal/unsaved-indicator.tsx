"use client";

import { PencilLine } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Spelled out, since a plain dot is too easy to misread.
export function UnsavedIndicator() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label="Nespremljene izmjene"
          className="inline-flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-600"
        >
          <PencilLine className="size-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent variant="warningSoft" className="max-w-56 text-xs">
        Imaš nespremljene izmjene. Klikni Spremi da ih sačuvaš ili Resetiraj da
        ih poništiš.
      </TooltipContent>
    </Tooltip>
  );
}
