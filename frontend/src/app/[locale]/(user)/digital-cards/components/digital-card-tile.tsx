"use client";

import { useState } from "react";

import CardFaceBack from "@/app/[locale]/(user)/digital-cards/components/card-face-back";
import CardFaceFront from "@/app/[locale]/(user)/digital-cards/components/card-face-front";
import PinToggleButton from "@/app/[locale]/(user)/digital-cards/components/pin-toggle-button";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import type { DigitalCardDto } from "@/lib/api/types";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { cn } from "@/lib/utils";
import { cardTileStyle } from "@/app/[locale]/(user)/digital-cards/utils/card-tile-style";
import { textColorFor } from "@/utils/color-contrast";

interface IDigitalCardTileProps {
  card: DigitalCardDto;
}

export default function DigitalCardTile({ card }: IDigitalCardTileProps) {
  const finePointer = useFinePointer();
  // The back face draws a barcode, so only pay for it once a cursor has actually visited.
  const [visited, setVisited] = useState(false);
  const archived = Boolean(card.archivedAt);
  const ink = textColorFor(card.cardColor);

  return (
    <div
      className={cn(
        "group/tile relative aspect-[3/2] [perspective:1000px]",
        finePointer &&
          "motion-safe:hover:[--tile-shadow:var(--tile-shadow-lift)]",
      )}
      style={cardTileStyle(card.cardColor, ink, archived)}
      onPointerEnter={() => finePointer && setVisited(true)}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 [transform-style:preserve-3d]",
          finePointer &&
            "motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/tile:[transform:translateY(-2px)_rotateY(180deg)]",
        )}
      >
        <CardFaceFront card={card} textColor={ink} />
        {finePointer && visited && <CardFaceBack card={card} />}
      </div>

      <button
        type="button"
        aria-label={`${card.storeName}, ${card.cardName}${archived ? " (arhivirana)" : ""}`}
        onClick={() =>
          openModalUrl({ name: "digital-card", action: "view", id: card.id })
        }
        className="absolute inset-0 z-[1] cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />

      <PinToggleButton
        cardId={card.id}
        cardName={card.cardName}
        pinned={Boolean(card.pinnedAt)}
      />
    </div>
  );
}
