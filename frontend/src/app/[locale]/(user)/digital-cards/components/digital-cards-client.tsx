"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Plus, Search } from "lucide-react";

import CardAnnouncer from "@/app/[locale]/(user)/digital-cards/components/card-announcer";
import DigitalCardsArchived from "@/app/[locale]/(user)/digital-cards/components/digital-cards-archived";
import DigitalCardsEmpty from "@/app/[locale]/(user)/digital-cards/components/digital-cards-empty";
import DigitalCardsGrid from "@/app/[locale]/(user)/digital-cards/components/digital-cards-grid";
import DigitalCardsSortSelect from "@/app/[locale]/(user)/digital-cards/components/digital-cards-sort-select";
import { useAutoOpenSingleCard } from "@/app/[locale]/(user)/digital-cards/hooks/use-auto-open-single-card";
import { useDigitalCardsSort } from "@/app/[locale]/(user)/digital-cards/hooks/use-digital-cards-sort";
import {
  filterCards,
  sortCards,
} from "@/app/[locale]/(user)/digital-cards/utils/card-sorting";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import LoginRequired from "@/components/custom/common/login-required";
import NoResults from "@/components/custom/common/no-results";
import ResponsiveLabel from "@/components/custom/common/responsive-label";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/context/user-context";
import { digitalCardService } from "@/lib/api";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { usePathname } from "@/i18n/navigation";

interface IDigitalCardsClientProps {
  query: string;
}

export default function DigitalCardsClient({
  query,
}: IDigitalCardsClientProps) {
  const t = useTranslations("digitalCards");
  const pathname = usePathname();
  const [sortMode, setSortMode] = useDigitalCardsSort();

  const { isAuthenticated, isLoading: userLoading } = useUser();
  const { data: cards = [], isLoading } =
    digitalCardService.useGetMyDigitalCards({ enabled: isAuthenticated });

  const isUserLoading = userLoading || isLoading;

  const matching = sortCards(filterCards(cards, query), sortMode);
  const active = matching.filter((card) => !card.archivedAt);
  const pinned = active.filter((card) => card.pinnedAt);
  const rest = active.filter((card) => !card.pinnedAt);
  const archived = matching.filter((card) => card.archivedAt);

  const activeCards = cards.filter((card) => !card.archivedAt);
  useAutoOpenSingleCard({
    ready: isAuthenticated && !isUserLoading,
    singleCardId: activeCards.length === 1 ? activeCards[0].id : null,
  });

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title={t("list.loginTitle")}
        description={t("list.loginDescription")}
        icon={<CreditCard className="size-12 text-primary" />}
      />
    );
  }

  function handleCreate() {
    openModalUrl({ name: "digital-card", action: "new" });
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("list.searchPlaceholder")}
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
          disabled={!isUserLoading && cards.length === 0}
        />
      </Suspense>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? t("list.searchResults", { query, count: matching.length })
            : isUserLoading
              ? t("list.myCards")
              : t("list.myCardsWithCount", { count: cards.length })}
        </h3>

        <div className="flex items-center gap-3">
          <DigitalCardsSortSelect value={sortMode} onChange={setSortMode} />

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

      <CardAnnouncer
        extra={
          query && !isUserLoading
            ? t("announce.results", { count: matching.length })
            : ""
        }
      />

      {isUserLoading ? (
        <div className="grid place-items-center">
          <BlockLoadingSpinner />
        </div>
      ) : cards.length === 0 ? (
        <DigitalCardsEmpty />
      ) : matching.length === 0 ? (
        <NoResults
          icon={<Search className="mx-auto mb-4 size-12 text-gray-400" />}
        />
      ) : (
        <>
          {pinned.length > 0 && (
            <DigitalCardsGrid cards={pinned} label={t("list.pinnedLabel")} />
          )}

          {pinned.length > 0 && rest.length > 0 && <Separator />}

          {rest.length > 0 && (
            <DigitalCardsGrid cards={rest} label={t("list.cardsLabel")} />
          )}

          {archived.length > 0 && (
            <DigitalCardsArchived
              key={query ? "searching" : "browsing"}
              cards={archived}
              defaultOpen={query.length > 0}
            />
          )}
        </>
      )}
    </div>
  );
}
