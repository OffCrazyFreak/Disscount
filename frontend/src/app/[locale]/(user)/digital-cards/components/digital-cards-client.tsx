"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";

import CardAnnouncer from "@/app/[locale]/(user)/digital-cards/components/card-announcer";
import DigitalCardsResults from "@/app/[locale]/(user)/digital-cards/components/digital-cards-results";
import DigitalCardsToolbar from "@/app/[locale]/(user)/digital-cards/components/digital-cards-toolbar";
import { useAutoOpenSingleCard } from "@/app/[locale]/(user)/digital-cards/hooks/use-auto-open-single-card";
import { useDigitalCardsSort } from "@/app/[locale]/(user)/digital-cards/hooks/use-digital-cards-sort";
import {
  filterCards,
  sortCards,
} from "@/app/[locale]/(user)/digital-cards/utils/card-sorting";
import LoginRequired from "@/components/custom/common/login-required";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { useUser } from "@/context/user-context";
import { digitalCardService } from "@/lib/api";
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

      <DigitalCardsToolbar
        query={query}
        matchCount={matching.length}
        totalCount={cards.length}
        isLoading={isUserLoading}
        sortMode={sortMode}
        onSortChange={setSortMode}
      />

      <CardAnnouncer
        extra={
          query && !isUserLoading
            ? t("announce.results", { count: matching.length })
            : ""
        }
      />

      <DigitalCardsResults
        query={query}
        isLoading={isUserLoading}
        totalCount={cards.length}
        matching={matching}
      />
    </div>
  );
}
