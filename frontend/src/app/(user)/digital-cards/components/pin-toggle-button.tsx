"use client";

import { Pin } from "lucide-react";

import { digitalCardService } from "@/lib/api";
import { cn } from "@/lib/utils";

interface IPinToggleButtonProps {
  cardId: string;
  pinned: boolean;
}

// A sibling of the tile's open button, never a child: buttons cannot nest, and a click
// here must not also open the card.
export default function PinToggleButton({
  cardId,
  pinned,
}: IPinToggleButtonProps) {
  const pinMutation = digitalCardService.usePinDigitalCard();

  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label="Prikvači karticu"
      onClick={(event) => {
        event.stopPropagation();
        pinMutation.mutate({ id: cardId, pinned: !pinned });
      }}
      className={cn(
        "absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-white/90 text-gray-900 shadow-sm transition-opacity",
        "focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        // Touch has no hover, so without this an unpinned card could never be pinned from the list.
        pinned
          ? "opacity-100"
          : "opacity-0 group-hover/tile:opacity-100 [@media(hover:none)]:opacity-100",
      )}
    >
      <Pin
        aria-hidden="true"
        className={cn("size-4", pinned && "fill-current")}
      />
    </button>
  );
}
