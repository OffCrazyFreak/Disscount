"use client";

import { useEffect, useRef } from "react";
import { Pin } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  announceCard,
  pinAnnouncementKey,
  pinButtonId,
  requestPinFocus,
  takePinFocus,
} from "@/app/[locale]/(user)/digital-cards/utils/card-announcer";
import { digitalCardService } from "@/lib/api";
import { cn } from "@/lib/utils";

interface IPinToggleButtonProps {
  cardId: string;
  cardName: string;
  pinned: boolean;
}

// A sibling of the tile's open button, never a child: buttons cannot nest, and a click
// here must not also open the card.
export default function PinToggleButton({
  cardId,
  cardName,
  pinned,
}: IPinToggleButtonProps) {
  const t = useTranslations("digitalCards");
  const pinMutation = digitalCardService.usePinDigitalCard();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Pinning moves the tile to the other grid, so this is a fresh mount that must pick
  // focus back up from the one that was clicked.
  useEffect(() => {
    if (takePinFocus(cardId)) buttonRef.current?.focus();
  }, [cardId]);

  return (
    <button
      ref={buttonRef}
      id={pinButtonId(cardId)}
      type="button"
      aria-pressed={pinned}
      aria-label={t("tile.pin", { name: cardName })}
      onClick={(event) => {
        event.stopPropagation();
        requestPinFocus(cardId);
        announceCard(t(pinAnnouncementKey(!pinned)));
        pinMutation.mutate({ id: cardId, pinned: !pinned });
      }}
      className={cn(
        "absolute right-2 top-2 z-10 grid size-[26px] place-items-center rounded-full bg-[var(--ink)] text-[var(--opp)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--opp)_18%,transparent),0_1px_1px_rgb(0_0_0/0.16)] transition-opacity",
        "focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        // Touch has no hover, so without this an unpinned card could never be pinned from the list.
        pinned
          ? "opacity-100"
          : "opacity-0 group-hover/tile:opacity-100 [@media(hover:none)]:opacity-100",
      )}
    >
      <Pin
        aria-hidden="true"
        className={cn("size-[14px]", pinned && "fill-current")}
      />
    </button>
  );
}
