"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import DigitalCardsArchived from "@/app/[locale]/(user)/digital-cards/components/digital-cards-archived";
import DigitalCardsEmpty from "@/app/[locale]/(user)/digital-cards/components/digital-cards-empty";
import DigitalCardsGrid from "@/app/[locale]/(user)/digital-cards/components/digital-cards-grid";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import NoResults from "@/components/custom/common/no-results";
import JumpSection from "@/components/custom/common/jump-section";
import SectionJumpNav from "@/components/custom/common/section-jump-nav";
import { Separator } from "@/components/ui/separator";
import type { DigitalCardDto } from "@/lib/api/types";

interface IDigitalCardsResultsProps {
  isLoading: boolean;
  totalCount: number;
  matching: DigitalCardDto[];
}

export default function DigitalCardsResults({
  isLoading,
  totalCount,
  matching,
}: IDigitalCardsResultsProps) {
  const t = useTranslations("digitalCards");

  if (isLoading) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
      </div>
    );
  }

  if (totalCount === 0) return <DigitalCardsEmpty />;

  if (matching.length === 0) {
    return (
      <NoResults
        icon={<Search className="mx-auto mb-4 size-12 text-gray-400" />}
      />
    );
  }

  const active = matching.filter((card) => !card.archivedAt);
  const pinned = active.filter((card) => card.pinnedAt);
  const rest = active.filter((card) => !card.pinnedAt);
  const archived = matching.filter((card) => card.archivedAt);

  return (
    <>
      <SectionJumpNav
        label={t("sectionNav.label")}
        sections={[
          ...(active.length > 0
            ? [{ id: "cards", label: t("sectionNav.cards") }]
            : []),
          ...(archived.length > 0
            ? [
                {
                  id: "archived",
                  label: t("sectionNav.archived"),
                  count: archived.length,
                },
              ]
            : []),
        ]}
      />

      {active.length > 0 && (
        <JumpSection id="cards" className="space-y-4">
          {pinned.length > 0 && (
            <DigitalCardsGrid cards={pinned} label={t("list.pinnedLabel")} />
          )}

          {pinned.length > 0 && rest.length > 0 && <Separator />}

          {rest.length > 0 && (
            <DigitalCardsGrid cards={rest} label={t("list.cardsLabel")} />
          )}
        </JumpSection>
      )}

      {archived.length > 0 && (
        <JumpSection id="archived">
          <DigitalCardsArchived cards={archived} />
        </JumpSection>
      )}
    </>
  );
}
