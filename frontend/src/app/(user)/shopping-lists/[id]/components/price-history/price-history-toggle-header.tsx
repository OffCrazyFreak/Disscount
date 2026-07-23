"use client";

import { ChevronDown } from "lucide-react";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface IPriceHistoryToggleHeaderProps {
  isOpen: boolean;
}

export default function PriceHistoryToggleHeader({
  isOpen,
}: IPriceHistoryToggleHeaderProps) {
  return (
    <CollapsibleTrigger asChild className="py-2">
      <button type="button" className="w-full text-left">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Povijest cijena</h2>

          <Separator className="flex-1 my-2" />

          <div className="flex items-center gap-4">
            <p className="hidden sm:inline text-gray-700 text-sm">
              {isOpen ? "Sakrij" : "Prikaži"}
            </p>

            <ChevronDown
              className={cn(
                "size-8 text-gray-500 transition-transform flex-shrink-0",
                isOpen && "rotate-180",
              )}
            />
          </div>
        </div>
      </button>
    </CollapsibleTrigger>
  );
}
