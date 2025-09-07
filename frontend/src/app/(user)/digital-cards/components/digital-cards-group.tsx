"use client";

import { DigitalCardDto } from "@/lib/api/types";
import { ViewMode } from "@/typings/view-mode";
import { AnimatedGroup } from "@/components/ui/animated-group";
import DigitalCardCard from "./digital-card-card";

interface DigitalCardsGroupProps {
  digitalCards: DigitalCardDto[];
  handleEdit: (digitalCard: DigitalCardDto) => void;
  viewMode?: ViewMode;
}

export default function DigitalCardsGroup({
  digitalCards,
  handleEdit,
  viewMode = "grid",
}: DigitalCardsGroupProps) {
  return (
    <AnimatedGroup
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
      }
      preset="fade"
    >
      {digitalCards.map((digitalCard) => (
        <DigitalCardCard
          key={digitalCard.id}
          handleEdit={handleEdit}
          digitalCard={digitalCard}
        />
      ))}
    </AnimatedGroup>
  );
}
