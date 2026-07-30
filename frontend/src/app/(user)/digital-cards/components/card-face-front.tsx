"use client";

import CardIcon from "@/app/(user)/digital-cards/components/card-icon";
import type { DigitalCardDto } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";

interface ICardFaceFrontProps {
  card: DigitalCardDto;
}

/**
 * Reads as a piece of plastic rather than a coloured div: a diagonal sheen band, a
 * light-catching top edge and a raised medallion are what sell it at this size.
 */
export default function CardFaceFront({ card }: ICardFaceFrontProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-xl [backface-visibility:hidden]"
      style={{
        background: `linear-gradient(140deg,
          color-mix(in oklab, ${card.cardColor} 86%, white) 0%,
          ${card.cardColor} 48%,
          color-mix(in oklab, ${card.cardColor} 82%, black) 100%)`,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)",
      }}
    >
      {/* Specular band, the detail that makes a flat fill look moulded. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -top-1/3 h-2/3 rotate-[18deg] bg-linear-to-b from-white/22 to-transparent"
      />

      <div className="relative flex size-full flex-col items-center justify-center gap-1.5 p-3">
        <div className="size-12 shrink-0 rounded-full ring-1 ring-black/10 shadow-md sm:size-14">
          <CardIcon
            iconImage={card.iconImage}
            chainCode={card.chainCode}
            storeName={card.storeName}
          />
        </div>

        <p className="line-clamp-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/90 drop-shadow-sm">
          {card.storeName}
        </p>
      </div>

      <p className="absolute bottom-2 left-3 max-w-[62%] truncate text-xs font-semibold text-white drop-shadow-sm">
        {card.cardName}
      </p>

      <p className="absolute bottom-2 right-3 text-[0.65rem] tabular-nums text-white/75">
        {formatDate(card.updatedAt)}
      </p>
    </div>
  );
}
