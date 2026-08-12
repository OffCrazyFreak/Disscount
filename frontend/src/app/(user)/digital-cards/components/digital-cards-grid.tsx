"use client";

import { Pin } from "lucide-react";

import { AnimatedGroup } from "@/components/custom/animation/animated-group";
import DigitalCardTile from "@/app/(user)/digital-cards/components/digital-card-tile";
import type { DigitalCardDto } from "@/lib/api/types";

interface IDigitalCardsGridProps {
  pinned: DigitalCardDto[];
  rest: DigitalCardDto[];
}

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3";

export default function DigitalCardsGrid({
  pinned,
  rest,
}: IDigitalCardsGridProps) {
  return (
    <div className="space-y-4">
      {pinned.length > 0 && (
        <section aria-label="Prikvačene kartice" className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Pin aria-hidden="true" className="size-3.5" />
            Prikvačene
          </h4>

          <AnimatedGroup preset="fade" className={GRID_CLASSES}>
            {pinned.map((card) => (
              <DigitalCardTile key={card.id} card={card} />
            ))}
          </AnimatedGroup>
        </section>
      )}

      {rest.length > 0 && (
        <section
          aria-label={pinned.length > 0 ? "Ostale kartice" : "Kartice"}
          className="space-y-2"
        >
          {/* The divider only earns its place once there is something above it. */}
          {pinned.length > 0 && <hr className="border-border" />}

          <AnimatedGroup preset="fade" className={GRID_CLASSES}>
            {rest.map((card) => (
              <DigitalCardTile key={card.id} card={card} />
            ))}
          </AnimatedGroup>
        </section>
      )}
    </div>
  );
}
