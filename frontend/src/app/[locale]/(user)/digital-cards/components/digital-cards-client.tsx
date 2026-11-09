"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";

import CardAnnouncer from "@/app/[locale]/(user)/digital-cards/components/card-announcer";
import DigitalCardsResults from "@/app/[locale]/(user)/digital-cards/components/digital-cards-results";
import DigitalCardsToolbar from "@/app/[locale]/(user)/digital-cards/components/digital-cards-toolbar";
import { useAutoOpenSingleCard } from "@/app/[locale]/(user)/digital-cards/hooks/use-auto-open-single-card";
import { useDigitalCardsSort } from "@/app/[locale]/(user)/digital-cards/hooks/use-digital-cards-sort";
import { useWalletCards } from "@/app/[locale]/(user)/digital-cards/hooks/use-wallet-cards";
import {
  filterCards,
  sortCards,
} from "@/app/[locale]/(user)/digital-cards/utils/card-sorting";
import LoginRequired from "@/components/custom/common/login-required";
import NotSavedOffline from "@/components/custom/common/not-saved-offline";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { usePathname } from "@/i18n/navigation";

export default function DigitalCardsClient() {
  const t = useTranslations("digitalCards");
  // Read on the client and searched shallowly, because offline a server render per keystroke would lose what was typed.
  const query = useSearchParams().get("q") ?? "";
  const pathname = usePathname();
  const [sortMode, setSortMode] = useDigitalCardsSort();

  const { cards, canShowCards, isNotSavedOffline, isAuthLoading, isLoading } =
    useWalletCards();

  const matching = sortCards(filterCards(cards, query), sortMode);

  const activeCards = cards.filter((card) => !card.archivedAt);
  useAutoOpenSingleCard({
    ready: canShowCards && !isLoading,
    singleCardId: activeCards.length === 1 ? activeCards[0].id : null,
  });

  if (!isAuthLoading && !canShowCards) {
    return (
      <LoginRequired
        title={t("list.loginTitle")}
        description={t("list.loginDescription")}
        icon={<CreditCard className="size-12 text-primary" />}
      />
    );
  }

  if (isNotSavedOffline)
    return <NotSavedOffline title={t("list.loginTitle")} />;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("list.searchPlaceholder")}
          searchRoute={pathname}
          submitButtonLocation="none"
          autoSearch={true}
          shallow
          disabled={!isLoading && cards.length === 0}
        />
      </Suspense>

      <DigitalCardsToolbar
        query={query}
        matchCount={matching.length}
        totalCount={cards.length}
        isLoading={isLoading}
        sortMode={sortMode}
        onSortChange={setSortMode}
      />

      <CardAnnouncer
        extra={
          query && !isLoading
            ? t("announce.results", { count: matching.length })
            : ""
        }
      />

      <DigitalCardsResults
        isLoading={isLoading}
        totalCount={cards.length}
        matching={matching}
      />
    </div>
  );
}
