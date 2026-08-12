"use client";

import CardCode from "@/app/(user)/digital-cards/components/card-code";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardFaceBackProps {
  card: DigitalCardDto;
}

/**
 * Decorative quick access for a mouse, so it is hidden from assistive tech: the code's
 * real home is the detail modal, which every input method can reach.
 *
 * The white face is literal rather than a theme token: a scanner reads contrast, so a
 * dark-mode card back would not scan.
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
          codeType={card.codeType}
          className="max-h-full [&_p]:text-sm"
        />
      </div>
    </div>
  );
}
