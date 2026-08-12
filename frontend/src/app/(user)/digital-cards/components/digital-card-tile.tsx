"use client";

import CardFaceBack from "@/app/(user)/digital-cards/components/card-face-back";
import CardFaceFront from "@/app/(user)/digital-cards/components/card-face-front";
import PinToggleButton from "@/app/(user)/digital-cards/components/pin-toggle-button";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { DigitalCardDto } from "@/lib/api/types";

interface IDigitalCardTileProps {
  card: DigitalCardDto;
}

/**
 * The open control is a full-bleed overlay button rather than a wrapping one, so the pin
 * toggle can sit above it without nesting interactive elements. Both live outside the
 * flipping element: a rotated button would be mirrored and unclickable.
 */
export default function DigitalCardTile({ card }: IDigitalCardTileProps) {
  return (
    <div className="group relative aspect-3/2 w-full [perspective:1200px]">
      <div className="relative size-full rounded-xl shadow-md transition-shadow duration-500 [transform-style:preserve-3d] group-hover:shadow-xl motion-safe:transition-transform motion-safe:duration-500 motion-safe:md:group-hover:[transform:rotateY(180deg)]">
        <CardFaceFront card={card} />
        <CardFaceBack card={card} />
      </div>

      <button
        type="button"
        onClick={() =>
          openModalUrl({ name: "digital-card", action: "view", id: card.id })
        }
        aria-label={`Otvori karticu ${card.cardName}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      />

      <div className="absolute right-2 top-2 z-20">
        <PinToggleButton card={card} revealOnHover />
      </div>
    </div>
  );
}
