"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import DigitalCardsSortSelect from "@/app/[locale]/(user)/digital-cards/components/digital-cards-sort-select";
import type { CardSortMode } from "@/app/[locale]/(user)/digital-cards/utils/card-sorting";
import ResponsiveLabel from "@/components/custom/common/responsive-label";
import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

interface IDigitalCardsToolbarProps {
  query: string;
  matchCount: number;
  totalCount: number;
  isLoading: boolean;
  sortMode: CardSortMode;
  onSortChange: (mode: CardSortMode) => void;
}

export default function DigitalCardsToolbar({
  query,
  matchCount,
  totalCount,
  isLoading,
  sortMode,
  onSortChange,
}: IDigitalCardsToolbarProps) {
  const t = useTranslations("digitalCards");

  function heading() {
    if (query.length > 0) {
      return t("list.searchResults", { query, count: matchCount });
    }

    return isLoading
      ? t("list.myCards")
      : t("list.myCardsWithCount", { count: totalCount });
  }

  function handleCreate() {
    openModalUrl({ name: "digital-card", action: "new" });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h3>{heading()}</h3>

      <div className="flex items-center gap-3">
        <DigitalCardsSortSelect value={sortMode} onChange={onSortChange} />

        <Button
          type="button"
          effect="expandIcon"
          onClick={handleCreate}
          icon={Plus}
          iconPlacement="left"
        >
          <ResponsiveLabel
            full={t("list.add.full")}
            short={t("list.add.short")}
          />
        </Button>
      </div>
    </div>
  );
}
