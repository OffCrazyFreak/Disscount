"use client";

import { ChevronDown } from "lucide-react";

import DigitalCardsGrid from "@/app/(user)/digital-cards/components/digital-cards-grid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { DigitalCardDto } from "@/lib/api/types";

interface IDigitalCardsArchivedProps {
  cards: DigitalCardDto[];
  defaultOpen: boolean;
}

export default function DigitalCardsArchived({
  cards,
  defaultOpen,
}: IDigitalCardsArchivedProps) {
  const label = `Arhivirane (${cards.length})`;

  return (
    <Collapsible defaultOpen={defaultOpen} className="group/archived">
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-left font-semibold">
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform group-data-[state=closed]/archived:-rotate-90 motion-reduce:transition-none"
        />
        {label}
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-1">
        <DigitalCardsGrid cards={cards} label={label} />
      </CollapsibleContent>
    </Collapsible>
  );
}
