"use client";

import CardCode from "@/app/(user)/digital-cards/components/card-code";
import type { CodeType } from "@/constants/card-codes";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardFaceBackProps {
  card: DigitalCardDto;
}

/**
 * Decorative quick access for a mouse, so it is hidden from assistive tech: the code's
 * real home is the detail modal, which every input method can reach.
 */
export default function CardFaceBack({ card }: ICardFaceBackProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden rounded-xl bg-white p-3 [backface-visibility:hidden] [transform:rotateY(180deg)]"
      style={{
        boxShadow: `inset 0 0 0 2px color-mix(in oklab, ${card.cardColor} 55%, white)`,
      }}
    >
      {/* The magnetic stripe of the real thing, in the card's own colour. */}
      <div
        className="absolute inset-x-0 top-0 h-2.5"
        style={{ backgroundColor: card.cardColor }}
      />

      <div className="grid size-full place-items-center pt-2">
        <CardCode
          codeValue={card.codeValue}
          codeType={card.codeType as CodeType}
          className="max-h-full [&_p]:text-sm"
        />
      </div>
    </div>
  );
}
