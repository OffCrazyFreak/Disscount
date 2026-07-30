"use client";

import { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";
import { CreditCard, Search } from "lucide-react";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import LoginRequired from "@/components/custom/common/login-required";
import NoResults from "@/components/custom/common/no-results";
import { digitalCardService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { filterByFields } from "@/utils/generic";
import CreateDigitalCardButton from "@/app/(user)/digital-cards/components/create-digital-card-button";
import DigitalCardsEmpty from "@/app/(user)/digital-cards/components/digital-cards-empty";
import DigitalCardsGrid from "@/app/(user)/digital-cards/components/digital-cards-grid";
import DigitalCardsSortSelect from "@/app/(user)/digital-cards/components/digital-cards-sort-select";
import { useDigitalCardsSort } from "@/app/(user)/digital-cards/hooks/use-digital-cards-sort";
import { groupAndSortCards } from "@/app/(user)/digital-cards/utils/card-sorting";

interface IDigitalCardsClientProps {
  query: string;
}

export default function DigitalCardsClient({
  query,
}: IDigitalCardsClientProps) {
  const pathname = usePathname();
  const [sort, setSort] = useDigitalCardsSort();

  const { isAuthenticated, isLoading: userLoading } = useUser();
  const { data: cards = [], isLoading } =
    digitalCardService.useGetCurrentUserDigitalCards({
      enabled: isAuthenticated,
    });

  const isUserLoading = userLoading || isLoading;

  // codeValue is deliberately not searchable: a card number must never reach the ?q= URL.
  const matchingCards = filterByFields(cards, query, [
    "cardName",
    "storeName",
    "note",
  ]);

  const { pinned, rest } = useMemo(
    () => groupAndSortCards(matchingCards, sort),
    [matchingCards, sort],
  );

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title="Digitalne kartice"
        description="Digitalne kartice ti omogućuju da sve kartice vjernosti nosiš u mobitelu i pokažeš ih na blagajni, bez interneta."
        icon={<CreditCard className="size-12 text-primary" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder="Pretraži kartice..."
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
          disabled={!isUserLoading && cards.length === 0}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" (${matchingCards.length})`
            : `Moje kartice${
                isUserLoading ? "" : ` (${matchingCards.length})`
              }`}
        </h3>

        <CreateDigitalCardButton />
      </div>

      {!isUserLoading && cards.length > 1 && (
        <DigitalCardsSortSelect value={sort} onValueChange={setSort} />
      )}

      {isUserLoading ? (
        <div className="grid place-items-center">
          <BlockLoadingSpinner />
        </div>
      ) : matchingCards.length > 0 ? (
        <DigitalCardsGrid pinned={pinned} rest={rest} />
      ) : query ? (
        <NoResults
          icon={<Search className="mx-auto mb-4 size-12 text-gray-400" />}
        />
      ) : (
        <DigitalCardsEmpty />
      )}
    </div>
  );
}
