"use client";

import { useTranslations } from "next-intl";

import DigitalCardsGrid from "@/app/[locale]/(user)/digital-cards/components/digital-cards-grid";
import type { DigitalCardDto } from "@/lib/api/types";

interface IDigitalCardsArchivedProps {
  cards: DigitalCardDto[];
}

export default function DigitalCardsArchived({
  cards,
}: IDigitalCardsArchivedProps) {
  const t = useTranslations("digitalCards");
  const label = t("archived.label", {
    label: t("sectionNav.archived"),
    count: cards.length,
  });

  return (
    <div className="space-y-1">
      <h2 className="font-semibold">{label}</h2>

      <DigitalCardsGrid cards={cards} label={label} />
    </div>
  );
}
