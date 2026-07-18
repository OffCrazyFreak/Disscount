"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Search, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import DigitalCardItem from "@/app/(user)/digital-cards/components/digital-card-item";
import NoResults from "@/components/custom/no-results";
import LoginRequired from "@/components/custom/login-required";
import CreateDigitalCardButton from "@/app/(user)/digital-cards/components/create-digital-card-button";
import { DigitalCardDto } from "@/lib/api/types";
import { useViewMode } from "@/hooks/use-view-mode";
import { filterByFields } from "@/utils/generic";
import { digitalCardService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";

export default function DigitalCardsClient({ query }: { query: string }) {
  const pathname = usePathname();
  const [viewMode] = useViewMode(pathname, "grid");

  const { isAuthenticated, isLoading: userLoading } = useUser();
  const { data: digitalCards = [], isLoading } =
    digitalCardService.useGetUserDigitalCards({ enabled: isAuthenticated });

  const isUserLoading = userLoading || isLoading;

  function handleEdit(digitalCard: DigitalCardDto) {
    openModalUrl({ name: "digital-card", action: "edit", id: digitalCard.id });
  }

  function handleCreate() {
    openModalUrl({ name: "digital-card", action: "new" });
  }

  const matchingDigitalCards = filterByFields(digitalCards, query, [
    "title",
    "type",
    "note",
  ]);

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title="Digitalne kartice"
        description="Digitalne kartice ti omogućuju da sve svoje kartice vjernosti držiš na jednom mjestu, uvijek pri ruci."
        icon={<CreditCard className="size-12 text-primary" />}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
          <SearchBar
            placeholder="Pretraži digitalne kartice..."
            searchRoute={pathname}
            clearable={true}
            submitButtonLocation="none"
            autoSearch={true}
          />
        </Suspense>

        <div className="flex items-center justify-between gap-4">
          <h3>
            {query.length > 0
              ? `Rezultati pretrage za "${query}" (${matchingDigitalCards.length})`
              : `Moje digitalne kartice${
                  isUserLoading ? "" : ` (${matchingDigitalCards.length})`
                }`}
          </h3>

          <CreateDigitalCardButton onCreateClick={handleCreate} />
        </div>

        {isUserLoading ? (
          <div className="grid place-items-center">
            <BlockLoadingSpinner />
          </div>
        ) : matchingDigitalCards.length > 0 ? (
          <AnimatedGroup
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            }
            preset="fade"
          >
            {matchingDigitalCards.map((digitalCard) => (
              <DigitalCardItem
                key={digitalCard.id}
                handleEdit={handleEdit}
                digitalCard={digitalCard}
              />
            ))}
          </AnimatedGroup>
        ) : query ? (
          <NoResults
            icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
          />
        ) : (
          <div className="text-center py-12">
            <CreditCard className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nema digitalnih kartica
            </h3>

            <p className="text-gray-600 mb-6">
              Stvorite svoju prvu digitalnu karticu…
            </p>

            <Button
              effect="shineHover"
              icon={Plus}
              iconPlacement="left"
              onClick={handleCreate}
            >
              Dodaj digitalnu karticu
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
