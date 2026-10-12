"use client";

import { useState } from "react";

import CardFaceBack from "@/app/(user)/digital-cards/components/card-face-back";
import CardFaceFront from "@/app/(user)/digital-cards/components/card-face-front";
import PinToggleButton from "@/app/(user)/digital-cards/components/pin-toggle-button";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import type { DigitalCardDto } from "@/lib/api/types";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { cn } from "@/lib/utils";
import { textColorFor } from "@/utils/color-contrast";

interface IDigitalCardTileProps {
  card: DigitalCardDto;
}

export default function DigitalCardTile({ card }: IDigitalCardTileProps) {
  const finePointer = useFinePointer();
  // The back face draws a barcode, so only pay for it once a cursor has actually visited.
  const [visited, setVisited] = useState(false);
  const archived = Boolean(card.archivedAt);

  return (
    <div
      className="group/tile relative aspect-[3/2] [perspective:1000px]"
      onPointerEnter={() => finePointer && setVisited(true)}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 [transform-style:preserve-3d]",
          archived && "opacity-60",
          finePointer &&
            "motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/tile:[transform:rotateY(180deg)]",
        )}
      >
        <CardFaceFront card={card} textColor={textColorFor(card.cardColor)} />
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

      <PinToggleButton cardId={card.id} pinned={Boolean(card.pinnedAt)} />
    </div>
  );
}
